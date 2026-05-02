"""
Lightweight evaluation harness.

Run with: `python -m core.ai.eval`

Each EVAL entry is a real-ish UNE message annotated with the expected category
and key extraction targets. The script runs `process_message` against each and
prints precision-style metrics per field. Exits 0 — never blocks CI; this is
a developer signal to flag regressions when the taxonomy/model is changed.

Add or refine entries as the corpus grows.
"""

from __future__ import annotations

import logging
import sys
from dataclasses import dataclass, field

from core.ai.processor import process_message


@dataclass
class EvalCase:
    text: str
    expected_category: str
    expected_blocks_affected: list[int] = field(default_factory=list)
    expected_blocks_recovered: list[int] = field(default_factory=list)
    expected_provinces: list[str] = field(default_factory=list)
    expected_municipalities: list[str] = field(default_factory=list)
    expected_sen_status: str | None = None
    expected_event_type: str | None = None


EVAL_SET: list[EvalCase] = [
    EvalCase(
        text=(
            "Información sobre el Sistema Eléctrico Nacional (SEN) en el día de ayer. "
            "Demanda máxima 3050 MW, disponibilidad 1850 MW, déficit en horario pico 1200 MW. "
            "Se afectó el servicio durante 18 horas continuas."
        ),
        expected_category="daily_resume",
        expected_event_type="daily_resume",
    ),
    EvalCase(
        text=(
            "Pronóstico para hoy: demanda máxima 3000 MW, disponibilidad 1900 MW, "
            "déficit estimado 1100 MW en el horario pico de 18:00 a 22:00."
        ),
        expected_category="daily_forecast",
    ),
    EvalCase(
        text=(
            "🚨‼️ Se informa la desconexión total del Sistema Electroenergético Nacional. "
            "Trabajamos en el restablecimiento."
        ),
        expected_category="sen_failure",
        expected_sen_status="active_failure",
        expected_event_type="blackout",
    ),
    EvalCase(
        text=(
            "Continúa el restablecimiento del Sistema Electroenergético Nacional, "
            "ya se ha logrado el 65 % de la generación nacional."
        ),
        expected_category="sen_recovery",
        expected_sen_status="recovering",
        expected_event_type="recovery",
    ),
    EvalCase(
        text=(
            "Se informa la afectación del bloque 1 a partir de las 10:00 am en los municipios "
            "Diez de Octubre, Cerro y Centro Habana."
        ),
        expected_category="block_affectation",
        expected_blocks_affected=[1],
        expected_provinces=["La Habana"] if False else [],
        expected_municipalities=["Centro Habana", "Diez de Octubre", "Cerro"],
    ),
    EvalCase(
        text="Restablecimiento del bloque 3 en horas de la tarde.",
        expected_category="block_recovery",
        expected_blocks_recovered=[3],
    ),
    EvalCase(
        text=(
            "Se reporta el disparo del circuito C-141 con afectaciones en el reparto Vedado. "
            "Brigadas trabajando en la avería primaria."
        ),
        expected_category="circuit_failure",
    ),
    EvalCase(
        text=(
            "Disparado Automático por Frecuencia en el Sistema Eléctrico Nacional a las 15:30. "
            "Se restablece servicio en los próximos minutos."
        ),
        expected_category="daf",
        expected_event_type="daf",
    ),
    EvalCase(
        text=(
            "La unidad 1 de la CTE Antonio Guiteras salió de servicio por avería. "
            "Personal técnico evalúa los daños."
        ),
        expected_category="thermal_unit_status",
    ),
    EvalCase(
        text=(
            "Mantenimiento programado en la subestación de Boyeros este sábado de 8:00 am a 4:00 pm."
        ),
        expected_category="scheduled_maintenance",
    ),
    EvalCase(
        text=(
            "Producto de las descargas eléctricas y los fuertes vientos asociados a la tormenta, "
            "se reportan afectaciones del servicio en varios circuitos de la provincia."
        ),
        expected_category="weather_impact",
    ),
    EvalCase(
        text=(
            "Estimados clientes, lamentamos los inconvenientes ocasionados. Para reportar averías, "
            "contacte la línea 1-8000-000-000."
        ),
        expected_category="apology_communication",
    ),
    EvalCase(
        text=(
            "🚨 Bloques 1, 2 y 3 fuera de servicio en horario pico. Déficit estimado 1450 MW."
        ),
        expected_category="block_affectation",
        expected_blocks_affected=[1, 2, 3],
    ),
    EvalCase(
        text="Se informa la recuperación del servicio eléctrico en el municipio Plaza de la Revolución.",
        expected_category="zone_recovery",
        expected_municipalities=["Plaza de la Revolución"],
    ),
    EvalCase(
        text=(
            "La CTE Felton 1 entró en sincronización a la red nacional aportando 240 MW de generación."
        ),
        expected_category="thermal_unit_status",
    ),
]


def _list_match(expected: list, actual: list) -> tuple[int, int, int]:
    """Returns (true_positive, false_positive, false_negative)."""
    expected_set = set(expected)
    actual_set = set(actual)
    tp = len(expected_set & actual_set)
    fp = len(actual_set - expected_set)
    fn = len(expected_set - actual_set)
    return tp, fp, fn


def run_eval() -> dict:
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(message)s")
    n = len(EVAL_SET)

    cat_correct = 0
    sen_correct = 0
    sen_total = 0
    event_correct = 0
    event_total = 0

    blocks_aff_tp = blocks_aff_fp = blocks_aff_fn = 0
    blocks_rec_tp = blocks_rec_fp = blocks_rec_fn = 0
    muni_tp = muni_fp = muni_fn = 0
    prov_tp = prov_fp = prov_fn = 0

    print(f"Running eval over {n} cases...\n")

    for i, case in enumerate(EVAL_SET, start=1):
        result = process_message(message_id=i, text=case.text)

        cat_ok = result.category == case.expected_category
        if cat_ok:
            cat_correct += 1

        if case.expected_sen_status:
            sen_total += 1
            if result.sen_status == case.expected_sen_status:
                sen_correct += 1

        if case.expected_event_type:
            event_total += 1
            if result.event_type == case.expected_event_type:
                event_correct += 1

        tp, fp, fn = _list_match(case.expected_blocks_affected, result.affected_blocks)
        blocks_aff_tp += tp
        blocks_aff_fp += fp
        blocks_aff_fn += fn

        tp, fp, fn = _list_match(case.expected_blocks_recovered, result.recovered_blocks)
        blocks_rec_tp += tp
        blocks_rec_fp += fp
        blocks_rec_fn += fn

        tp, fp, fn = _list_match(case.expected_municipalities, result.affected_municipalities)
        muni_tp += tp
        muni_fp += fp
        muni_fn += fn

        tp, fp, fn = _list_match(case.expected_provinces, result.affected_provinces)
        prov_tp += tp
        prov_fp += fp
        prov_fn += fn

        marker = "✓" if cat_ok else "✗"
        snippet = case.text[:80].replace("\n", " ")
        print(
            f"[{marker}] {i:02d} expected={case.expected_category:25s} "
            f"got={result.category:25s} ({result.category_confidence:.2f}) — {snippet}"
        )

    def _prf(tp: int, fp: int, fn: int) -> tuple[float, float, float]:
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        return prec, rec, f1

    print("\n--- METRICS ---")
    print(f"Category top-1 accuracy: {cat_correct}/{n} ({100*cat_correct/n:.1f}%)")
    if sen_total:
        print(f"SEN status accuracy:     {sen_correct}/{sen_total} ({100*sen_correct/sen_total:.1f}%)")
    if event_total:
        print(f"Event type accuracy:     {event_correct}/{event_total} ({100*event_correct/event_total:.1f}%)")

    for label, (tp, fp, fn) in {
        "Affected blocks": (blocks_aff_tp, blocks_aff_fp, blocks_aff_fn),
        "Recovered blocks": (blocks_rec_tp, blocks_rec_fp, blocks_rec_fn),
        "Municipalities":  (muni_tp, muni_fp, muni_fn),
        "Provinces":       (prov_tp, prov_fp, prov_fn),
    }.items():
        p, r, f1 = _prf(tp, fp, fn)
        print(f"{label:18s} precision={p:.2f} recall={r:.2f} f1={f1:.2f} (tp={tp} fp={fp} fn={fn})")

    return {
        "category_accuracy": cat_correct / n,
        "n_cases": n,
    }


if __name__ == "__main__":
    result = run_eval()
    sys.exit(0)
