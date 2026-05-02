"""
Lazy singleton loaders for the HuggingFace models.

Both models are quantized to ONNX int8 on first access (cached on disk for
subsequent runs) to keep memory and latency manageable on GitHub Actions
free-tier CPU runners (4 cores, 16GB RAM, no GPU).

ONNX Runtime is configured with explicit thread settings to fully exploit
the 4 vCPUs (intra-op = #cores, inter-op = 1) and to prefer ALL graph
optimizations. This alone is roughly a 2-3x speedup on CPU compared to
the defaults `transformers` ships with.

Models:
- Zero-shot classifier: MoritzLaurer/mDeBERTa-v3-base-mnli-xnli
- NER (Spanish): mrm8488/bert-spanish-cased-finetuned-ner

Cache layout (under HF_HOME or ~/.cache/huggingface):
    hub/                <- raw HF downloads (default)
    onnx/<model_id>/    <- exported + quantized ONNX

Public API:
    get_zero_shot_classifier() -> transformers.Pipeline
    get_ner_pipeline() -> transformers.Pipeline
    warm_models() -> None  (eager load, used to populate cache in CI)
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
    """
    Choose which ONNX file to load. Prefers `model_quantized.onnx` (int8) when
    quantization succeeded, falls back to `model.onnx` (fp32) otherwise.
    """
    quantized = target_dir / "model_quantized.onnx"
    if quantized.exists():
        return "model_quantized.onnx"
    return "model.onnx"


def _build_session_options():
    """
    Build ONNX Runtime session options tuned for CPU inference on GitHub Actions
    runners (4 vCPUs). Intra-op parallelism uses all cores; inter-op is kept at 1
    because we run a single graph at a time. Graph optimization is set to ALL
    so quantized ops can fuse aggressively.
    """
    import onnxruntime as ort

    cpu_count = max(1, os.cpu_count() or 4)
    sess_options = ort.SessionOptions()
    sess_options.intra_op_num_threads = cpu_count
    sess_options.inter_op_num_threads = 1
    sess_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    return sess_options


def _retry(fn, *, attempts: int = 3, label: str = ""):
    """Run fn() with exponential backoff. Re-raises last exception."""
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


# ---------------------- Zero-Shot Classifier (ONNX) ---------------------- #

_zero_shot_pipeline = None


def _export_and_quantize_zero_shot(target_dir: Path) -> None:
    """Export the model to ONNX (fp32) then dynamically quantize to int8."""
    from optimum.onnxruntime import ORTModelForSequenceClassification

    logger.info("[ai.models] Exporting %s to ONNX at %s", ZERO_SHOT_MODEL_ID, target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    model = ORTModelForSequenceClassification.from_pretrained(
        ZERO_SHOT_MODEL_ID, export=True
    )
    model.save_pretrained(str(target_dir))

    # Quantize dynamically to int8 to slash memory footprint.
    try:
        from optimum.onnxruntime import ORTQuantizer
        from optimum.onnxruntime.configuration import AutoQuantizationConfig

        quantizer = ORTQuantizer.from_pretrained(str(target_dir))
        qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)
        quantizer.quantize(save_dir=str(target_dir), quantization_config=qconfig)
        logger.info("[ai.models] Quantized zero-shot model to int8.")
    except Exception as exc:  # noqa: BLE001
        # Quantization is an optimization, not a hard requirement.
        logger.warning(
            "[ai.models] Quantization skipped for zero-shot (%s). Using fp32 ONNX.",
            exc,
        )


def _load_zero_shot_pipeline():
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


def get_zero_shot_classifier():
    """Returns the cached zero-shot pipeline. Thread-safe enough for our single-process use."""
    global _zero_shot_pipeline
    if _zero_shot_pipeline is None:
        _zero_shot_pipeline = _load_zero_shot_pipeline()
    return _zero_shot_pipeline


# ---------------------- NER pipeline (BETO, ONNX) ---------------------- #

_ner_pipeline = None


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


def _load_ner_pipeline():
    from transformers import AutoTokenizer, pipeline
    from optimum.onnxruntime import ORTModelForTokenClassification

    target_dir = _onnx_dir(NER_MODEL_ID)
    is_ready = (target_dir / "config.json").exists()

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


def get_ner_pipeline():
    """Returns the cached NER pipeline."""
    global _ner_pipeline
    if _ner_pipeline is None:
        _ner_pipeline = _load_ner_pipeline()
    return _ner_pipeline


# ---------------------- Eager warm-up for CI ---------------------- #


def warm_models() -> None:
    """Eager-load both models. Used by the CI 'Warm AI models' step."""
    logger.info("[ai.models] Warming zero-shot classifier...")
    get_zero_shot_classifier()
    logger.info("[ai.models] Warming NER pipeline...")
    get_ner_pipeline()
    logger.info("[ai.models] Both models warm and ready.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    warm_models()
