"""
Lazy singleton loaders for the HuggingFace models with two backends.

Backend selection is automatic, based on hardware:

  • GPU available (CUDA)  -> PyTorch on cuda + fp16. Used in Google Colab and any
                             machine with a CUDA GPU. Single-digit ms/msg latency.
  • CPU only              -> ONNX Runtime int8 (dynamically quantized on first
                             access, then cached). Used by GitHub Actions runners.

The backend can be forced via the env var `UNE_AI_BACKEND` (`gpu` | `cpu`),
otherwise it is auto-detected.

Models:
- Zero-shot classifier: MoritzLaurer/mDeBERTa-v3-base-mnli-xnli
- NER (Spanish): mrm8488/bert-spanish-cased-finetuned-ner

Cache layout (under HF_HOME or ~/.cache/huggingface):
    hub/                <- raw HF downloads (default)
    onnx/<model_id>/    <- exported + quantized ONNX (CPU backend only)

Public API:
    get_zero_shot_classifier() -> transformers.Pipeline
    get_ner_pipeline() -> transformers.Pipeline
    warm_models() -> None  (eager load, used to populate cache in CI/Colab)
    detect_backend() -> str  ("gpu" | "cpu")
"""

from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


ZERO_SHOT_MODEL_ID = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"
NER_MODEL_ID = "mrm8488/bert-spanish-cased-finetuned-ner"


class AIModelLoadError(RuntimeError):
    """Raised when a model can't be loaded after retries."""


# -------------------- Backend detection -------------------- #

_backend_cache: Optional[str] = None


def detect_backend() -> str:
    """
    Returns "gpu" when a CUDA GPU is available and the user hasn't forced CPU,
    otherwise "cpu". Memoized after the first call.
    """
    global _backend_cache
    if _backend_cache is not None:
        return _backend_cache

    forced = (os.environ.get("UNE_AI_BACKEND") or "").lower().strip()
    if forced in {"gpu", "cuda"}:
        _backend_cache = "gpu"
        return _backend_cache
    if forced in {"cpu", "onnx"}:
        _backend_cache = "cpu"
        return _backend_cache

    try:
        import torch  # noqa: F401

        if torch.cuda.is_available():
            _backend_cache = "gpu"
            return _backend_cache
    except Exception:  # noqa: BLE001
        pass

    _backend_cache = "cpu"
    return _backend_cache


def gpu_info() -> dict:
    """Returns a dict with name, vram_gb, count when running on GPU; empty otherwise."""
    if detect_backend() != "gpu":
        return {}
    try:
        import torch

        idx = 0
        name = torch.cuda.get_device_name(idx)
        props = torch.cuda.get_device_properties(idx)
        return {
            "name": name,
            "vram_gb": round(props.total_memory / 1024 ** 3, 1),
            "count": torch.cuda.device_count(),
        }
    except Exception:  # noqa: BLE001
        return {}


# -------------------- Filesystem helpers -------------------- #


def _hf_cache_root() -> Path:
    """Resolve the HF cache root, creating it if needed."""
    hf_home = os.environ.get("HF_HOME")
    if hf_home:
        root = Path(hf_home)
    else:
        root = Path.home() / ".cache" / "huggingface"
    root.mkdir(parents=True, exist_ok=True)
    return root


def _onnx_dir(model_id: str) -> Path:
    safe = model_id.replace("/", "__")
    return _hf_cache_root() / "onnx" / safe


def _resolve_onnx_filename(target_dir: Path) -> str:
    """Prefer `model_quantized.onnx` (int8) when present."""
    quantized = target_dir / "model_quantized.onnx"
    if quantized.exists():
        return "model_quantized.onnx"
    return "model.onnx"


def _build_session_options():
    """ONNX Runtime session options tuned for CPU multi-core inference."""
    import onnxruntime as ort

    cpu_count = max(1, os.cpu_count() or 4)
    sess_options = ort.SessionOptions()
    sess_options.intra_op_num_threads = cpu_count
    sess_options.inter_op_num_threads = 1
    sess_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    return sess_options


def _retry(fn, *, attempts: int = 3, label: str = ""):
    """Run fn() with exponential backoff."""
    delays = [5, 30, 120]
    last_exc: Optional[BaseException] = None
    for i in range(attempts):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if i >= attempts - 1:
                break
            wait = delays[min(i, len(delays) - 1)]
            logger.warning(
                "[ai.models] %s attempt %d/%d failed (%s). Sleeping %ds before retry.",
                label or "load",
                i + 1,
                attempts,
                exc.__class__.__name__,
                wait,
            )
            time.sleep(wait)
    raise AIModelLoadError(f"Failed after {attempts} attempts: {last_exc}") from last_exc


# -------------------- GPU backend (PyTorch + CUDA fp16) -------------------- #


def _load_zero_shot_pipeline_gpu():
    from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline
    import torch

    logger.info("[ai.models] Loading zero-shot on GPU: %s", ZERO_SHOT_MODEL_ID)

    tokenizer = _retry(
        lambda: AutoTokenizer.from_pretrained(ZERO_SHOT_MODEL_ID),
        attempts=3,
        label=f"tokenizer {ZERO_SHOT_MODEL_ID}",
    )
    model = _retry(
        lambda: AutoModelForSequenceClassification.from_pretrained(
            ZERO_SHOT_MODEL_ID, torch_dtype=torch.float16
        ).to("cuda").eval(),
        attempts=2,
        label="load PT zero-shot",
    )
    return pipeline(
        task="zero-shot-classification",
        model=model,
        tokenizer=tokenizer,
        device=0,
    )


def _load_ner_pipeline_gpu():
    from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline
    import torch

    logger.info("[ai.models] Loading NER on GPU: %s", NER_MODEL_ID)

    tokenizer = _retry(
        lambda: AutoTokenizer.from_pretrained(NER_MODEL_ID),
        attempts=3,
        label=f"tokenizer {NER_MODEL_ID}",
    )
    model = _retry(
        lambda: AutoModelForTokenClassification.from_pretrained(
            NER_MODEL_ID, torch_dtype=torch.float16
        ).to("cuda").eval(),
        attempts=2,
        label="load PT NER",
    )
    return pipeline(
        task="token-classification",
        model=model,
        tokenizer=tokenizer,
        aggregation_strategy="simple",
        device=0,
    )


# -------------------- CPU backend (ONNX int8) -------------------- #


def _export_and_quantize_zero_shot(target_dir: Path) -> None:
    from optimum.onnxruntime import ORTModelForSequenceClassification

    logger.info("[ai.models] Exporting %s to ONNX at %s", ZERO_SHOT_MODEL_ID, target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    model = ORTModelForSequenceClassification.from_pretrained(
        ZERO_SHOT_MODEL_ID, export=True
    )
    model.save_pretrained(str(target_dir))

    try:
        from optimum.onnxruntime import ORTQuantizer
        from optimum.onnxruntime.configuration import AutoQuantizationConfig

        quantizer = ORTQuantizer.from_pretrained(str(target_dir))
        qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)
        quantizer.quantize(save_dir=str(target_dir), quantization_config=qconfig)
        logger.info("[ai.models] Quantized zero-shot model to int8.")
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "[ai.models] Quantization skipped for zero-shot (%s). Using fp32 ONNX.",
            exc,
        )


def _load_zero_shot_pipeline_cpu():
    from transformers import AutoTokenizer, pipeline
    from optimum.onnxruntime import ORTModelForSequenceClassification

    target_dir = _onnx_dir(ZERO_SHOT_MODEL_ID)
    is_ready = (target_dir / "config.json").exists() and (
        (target_dir / "model.onnx").exists() or (target_dir / "model_quantized.onnx").exists()
    )

    if not is_ready:
        _retry(
            lambda: _export_and_quantize_zero_shot(target_dir),
            attempts=3,
            label=f"export {ZERO_SHOT_MODEL_ID}",
        )

    tokenizer = _retry(
        lambda: AutoTokenizer.from_pretrained(ZERO_SHOT_MODEL_ID),
        attempts=3,
        label=f"tokenizer {ZERO_SHOT_MODEL_ID}",
    )
    onnx_file = _resolve_onnx_filename(target_dir)
    logger.info("[ai.models] Loading zero-shot ONNX: %s", onnx_file)
    sess_options = _build_session_options()
    model = _retry(
        lambda: ORTModelForSequenceClassification.from_pretrained(
            str(target_dir), file_name=onnx_file, session_options=sess_options
        ),
        attempts=2,
        label="load ONNX zero-shot",
    )
    return pipeline(
        task="zero-shot-classification",
        model=model,
        tokenizer=tokenizer,
    )


def _export_and_quantize_ner(target_dir: Path) -> None:
    from optimum.onnxruntime import ORTModelForTokenClassification

    logger.info("[ai.models] Exporting %s to ONNX at %s", NER_MODEL_ID, target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    model = ORTModelForTokenClassification.from_pretrained(NER_MODEL_ID, export=True)
    model.save_pretrained(str(target_dir))

    try:
        from optimum.onnxruntime import ORTQuantizer
        from optimum.onnxruntime.configuration import AutoQuantizationConfig

        quantizer = ORTQuantizer.from_pretrained(str(target_dir))
        qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)
        quantizer.quantize(save_dir=str(target_dir), quantization_config=qconfig)
        logger.info("[ai.models] Quantized NER model to int8.")
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "[ai.models] Quantization skipped for NER (%s). Using fp32 ONNX.",
            exc,
        )


def _load_ner_pipeline_cpu():
    from transformers import AutoTokenizer, pipeline
    from optimum.onnxruntime import ORTModelForTokenClassification

    target_dir = _onnx_dir(NER_MODEL_ID)
    is_ready = (target_dir / "config.json").exists() and (
        (target_dir / "model.onnx").exists() or (target_dir / "model_quantized.onnx").exists()
    )

    if not is_ready:
        _retry(
            lambda: _export_and_quantize_ner(target_dir),
            attempts=3,
            label=f"export {NER_MODEL_ID}",
        )

    tokenizer = _retry(
        lambda: AutoTokenizer.from_pretrained(NER_MODEL_ID),
        attempts=3,
        label=f"tokenizer {NER_MODEL_ID}",
    )
    onnx_file = _resolve_onnx_filename(target_dir)
    logger.info("[ai.models] Loading NER ONNX: %s", onnx_file)
    sess_options = _build_session_options()
    model = _retry(
        lambda: ORTModelForTokenClassification.from_pretrained(
            str(target_dir), file_name=onnx_file, session_options=sess_options
        ),
        attempts=2,
        label="load ONNX NER",
    )
    return pipeline(
        task="token-classification",
        model=model,
        tokenizer=tokenizer,
        aggregation_strategy="simple",
    )


# -------------------- Public singleton API -------------------- #


_zero_shot_pipeline = None
_ner_pipeline = None


def get_zero_shot_classifier():
    """Returns the cached zero-shot pipeline (GPU or CPU backend, auto-detected)."""
    global _zero_shot_pipeline
    if _zero_shot_pipeline is None:
        backend = detect_backend()
        logger.info("[ai.models] Selected backend: %s", backend)
        if backend == "gpu":
            _zero_shot_pipeline = _load_zero_shot_pipeline_gpu()
        else:
            _zero_shot_pipeline = _load_zero_shot_pipeline_cpu()
    return _zero_shot_pipeline


def get_ner_pipeline():
    """Returns the cached NER pipeline (GPU or CPU backend, auto-detected)."""
    global _ner_pipeline
    if _ner_pipeline is None:
        backend = detect_backend()
        if backend == "gpu":
            _ner_pipeline = _load_ner_pipeline_gpu()
        else:
            _ner_pipeline = _load_ner_pipeline_cpu()
    return _ner_pipeline


def warm_models() -> None:
    """Eager-load both models. Used by the CI 'Warm AI models' step and by Colab."""
    backend = detect_backend()
    logger.info("[ai.models] Warming models on backend=%s", backend)
    if backend == "gpu":
        info = gpu_info()
        if info:
            logger.info(
                "[ai.models] GPU detected: %s (%.1f GB VRAM, %d device(s))",
                info.get("name"),
                info.get("vram_gb", 0),
                info.get("count", 0),
            )
    get_zero_shot_classifier()
    get_ner_pipeline()
    logger.info("[ai.models] Both models warm and ready.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    warm_models()
