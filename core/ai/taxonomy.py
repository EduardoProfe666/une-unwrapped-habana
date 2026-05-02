"""
Taxonomy of message categories used for zero-shot classification.

Each category has:
- id: stable string used as DB value and JSON key.
- label: short human-readable label (Spanish).
- hypothesis_es: full Spanish sentence used as NLI hypothesis. This wording is
  what mDeBERTa-v3-mnli-xnli scores against the message, so it must read as a
  natural Spanish sentence describing what the message is about.
- description: longer description for documentation / eval.
- threshold: minimum confidence for this category to be selected over fallback.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Category:
    id: str
    label: str
    hypothesis_es: str
    description: str
    threshold: float = 0.35


CATEGORIES: list[Category] = [
    Category(
        id="sen_failure",
        label="Desconexión total del SEN",
        hypothesis_es="Este mensaje reporta un apagón nacional o desconexión total del Sistema Electroenergético Nacional (SEN) afectando a todo el país.",
        description="Apagón nacional o desconexión total del SEN.",
        threshold=0.45,
    ),
    Category(
        id="sen_recovery",
        label="Restablecimiento del SEN",
        hypothesis_es="Este mensaje reporta el avance o conclusión del restablecimiento del Sistema Electroenergético Nacional tras un apagón total, mencionando porcentaje de restablecimiento o sincronización nacional.",
        description="Avance porcentual o conclusión del restablecimiento tras desconexión total del SEN.",
        threshold=0.4,
    ),
    Category(
        id="block_affectation",
        label="Afectación de bloque(s)",
        hypothesis_es="Este mensaje anuncia que uno o varios bloques de carga (numerados 1 al 6) se encuentran afectados, fuera de servicio o con déficit.",
        description="Afectación programada o no programada por bloque (1-6).",
    ),
    Category(
        id="block_recovery",
        label="Restablecimiento de bloque",
        hypothesis_es="Este mensaje informa que uno o varios bloques de carga (numerados 1 al 6) han sido restablecidos, recuperados o normalizados en su servicio.",
        description="Restablecimiento total o parcial de uno o más bloques.",
    ),
    Category(
        id="circuit_failure",
        label="Falla de circuito local",
        hypothesis_es="Este mensaje describe una avería local concreta: disparo de un circuito específico, transformador dañado o avería primaria/secundaria en una zona puntual.",
        description="Avería primaria/secundaria, transformadores dañados o disparo de circuito.",
    ),
    Category(
        id="zone_outage",
        label="Afectación zonal específica",
        hypothesis_es="Este mensaje anuncia un corte o afectación del servicio eléctrico en un reparto, municipio o consejo popular concreto, sin mencionar bloques de carga.",
        description="Corte por zona/reparto/municipio sin clasificarse como bloque.",
    ),
    Category(
        id="zone_recovery",
        label="Recuperación zonal",
        hypothesis_es="Este mensaje informa que se ha recuperado o restablecido el servicio eléctrico en un reparto, municipio o consejo popular concreto, sin mencionar bloques.",
        description="Recuperación de servicio en zona/municipio específico.",
    ),
    Category(
        id="daily_resume",
        label="Resumen diario",
        hypothesis_es="Este mensaje es un balance retrospectivo del día anterior, comenzando con frases como 'en el día de ayer' o 'durante la jornada de ayer', con cifras finales de afectación.",
        description="Resumen del día anterior con cifras de demanda y generación.",
    ),
    Category(
        id="daily_forecast",
        label="Pronóstico diario",
        hypothesis_es="Este mensaje es un parte operativo del día de hoy con estimaciones futuras de demanda máxima, disponibilidad esperada y déficit previsto en el horario pico.",
        description="Proyección de demanda/déficit/horario pico del día actual.",
    ),
    Category(
        id="daf",
        label="Disparado Automático por Frecuencia",
        hypothesis_es="Este mensaje reporta explícitamente un evento de DAF (Disparado Automático por Frecuencia), un corte súbito por inestabilidad de frecuencia del sistema.",
        description="DAF: corte súbito por inestabilidad de frecuencia.",
        threshold=0.3,
    ),
    Category(
        id="thermal_unit_status",
        label="Estado de unidad termoeléctrica",
        hypothesis_es="Este mensaje reporta el estado de una unidad de central termoeléctrica específica (CTE) por su nombre — Antonio Guiteras, Felton, Renté, Mariel, Cienfuegos, Nuevitas, Tallapiedra o Ernesto Che Guevara — incluyendo salida, entrada o sincronización.",
        description="Salida/entrada de unidad de central termoeléctrica específica.",
    ),
    Category(
        id="scheduled_maintenance",
        label="Mantenimiento programado",
        hypothesis_es="Este mensaje anuncia con antelación un mantenimiento o trabajo programado en una subestación, línea o equipo eléctrico para una fecha futura específica.",
        description="Mantenimiento anunciado con anticipación.",
    ),
    Category(
        id="weather_impact",
        label="Impacto meteorológico",
        hypothesis_es="Este mensaje atribuye afectaciones del servicio eléctrico a condiciones meteorológicas: lluvias intensas, fuertes vientos, descargas eléctricas, tormentas o ciclones.",
        description="Eventos por clima (lluvias, viento, descargas, ciclón).",
    ),
    Category(
        id="apology_communication",
        label="Comunicación o disculpa institucional",
        hypothesis_es="Este mensaje es exclusivamente una disculpa a los clientes, agradecimiento por la comprensión o referencia a canales de atención y números de contacto, sin reportar un evento técnico.",
        description="Disculpas, anuncio de canales, comunicación institucional.",
    ),
    Category(
        id="general_info",
        label="Información general",
        hypothesis_es="Este mensaje es una nota informativa institucional general sin reportar un evento operacional concreto del sistema eléctrico.",
        description="Aviso institucional sin evento operacional concreto. También fallback para baja confianza.",
    ),
]


CATEGORIES_BY_ID: dict[str, Category] = {c.id: c for c in CATEGORIES}

DEFAULT_CONFIDENCE_THRESHOLD: float = 0.35

CATEGORY_TO_EVENT_TYPE: dict[str, str] = {
    "sen_failure": "blackout",
    "sen_recovery": "recovery",
    "block_affectation": "failure",
    "block_recovery": "recovery",
    "circuit_failure": "failure",
    "zone_outage": "failure",
    "zone_recovery": "recovery",
    "daily_resume": "daily_resume",
    "daily_forecast": "info",
    "daf": "daf",
    "thermal_unit_status": "info",
    "scheduled_maintenance": "scheduled_cut",
    "weather_impact": "info",
    "apology_communication": "info",
    "general_info": "info",
}

EVENT_TYPES: tuple[str, ...] = (
    "failure",
    "recovery",
    "scheduled_cut",
    "info",
    "daily_resume",
    "daf",
    "blackout",
    "other",
)

SEVERITY_LEVELS: tuple[str, ...] = ("low", "medium", "high", "critical")

SEN_STATUSES: tuple[str, ...] = (
    "normal",
    "active_failure",
    "recovering",
    "unknown",
)


def get_hypotheses() -> list[str]:
    """Returns the list of hypothesis strings in the same order as CATEGORIES."""
    return [c.hypothesis_es for c in CATEGORIES]


def get_category_ids() -> list[str]:
    """Returns the list of category ids in the same order as CATEGORIES."""
    return [c.id for c in CATEGORIES]
