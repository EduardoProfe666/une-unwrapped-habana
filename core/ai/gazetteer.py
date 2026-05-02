"""
Hardcoded catalogs of Cuban geography and power infrastructure.

Each entry maps a canonical name to a list of aliases. Matching uses
word-boundary regex over a normalized (lowercased, ASCII-folded) text.
The NER model acts as a safety net: spans labeled LOC/ORG/MISC that don't
match any catalog entry are still surfaced via raw_features for auditability.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field


def _normalize(text: str) -> str:
    """Lowercase + strip diacritics for robust matching."""
    if not text:
        return ""
    norm = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in norm if unicodedata.category(c) != "Mn")


@dataclass
class GazetteerEntry:
    canonical: str
    aliases: tuple[str, ...]
    extra: dict = field(default_factory=dict)

    def all_forms(self) -> tuple[str, ...]:
        return (self.canonical, *self.aliases)


# ---------- PROVINCIAS DE CUBA (16 incl. Isla de la Juventud) ---------- #

PROVINCES_CUBA: list[GazetteerEntry] = [
    GazetteerEntry("Pinar del Río", ("pinar del rio", "pinar")),
    GazetteerEntry("Artemisa", ("artemisa",)),
    GazetteerEntry("La Habana", ("habana", "la habana", "ciudad de la habana", "capital")),
    GazetteerEntry("Mayabeque", ("mayabeque",)),
    GazetteerEntry("Matanzas", ("matanzas",)),
    GazetteerEntry("Villa Clara", ("villa clara", "santa clara")),
    GazetteerEntry("Cienfuegos", ("cienfuegos",)),
    GazetteerEntry("Sancti Spíritus", ("sancti spiritus", "espiritus")),
    GazetteerEntry("Ciego de Ávila", ("ciego de avila", "ciego")),
    GazetteerEntry("Camagüey", ("camaguey",)),
    GazetteerEntry("Las Tunas", ("las tunas", "tunas")),
    GazetteerEntry("Holguín", ("holguin",)),
    GazetteerEntry("Granma", ("granma",)),
    GazetteerEntry("Santiago de Cuba", ("santiago de cuba", "santiago")),
    GazetteerEntry("Guantánamo", ("guantanamo",)),
    GazetteerEntry("Isla de la Juventud", ("isla de la juventud", "isla", "ij")),
]


# ---------- MUNICIPIOS DE LA HABANA (15) ---------- #

MUNICIPALITIES_HAVANA: list[GazetteerEntry] = [
    GazetteerEntry("Playa", ("playa",)),
    GazetteerEntry("Plaza de la Revolución", ("plaza de la revolucion", "plaza")),
    GazetteerEntry("Centro Habana", ("centro habana",)),
    GazetteerEntry("Habana Vieja", ("habana vieja", "la habana vieja")),
    GazetteerEntry("Regla", ("regla",)),
    GazetteerEntry("Habana del Este", ("habana del este", "este")),
    GazetteerEntry("Guanabacoa", ("guanabacoa",)),
    GazetteerEntry("San Miguel del Padrón", ("san miguel del padron", "san miguel")),
    GazetteerEntry("Diez de Octubre", ("diez de octubre", "10 de octubre", "10 oct")),
    GazetteerEntry("Cerro", ("cerro",)),
    GazetteerEntry("Marianao", ("marianao",)),
    GazetteerEntry("La Lisa", ("la lisa", "lisa")),
    GazetteerEntry("Boyeros", ("boyeros",)),
    GazetteerEntry("Arroyo Naranjo", ("arroyo naranjo", "arroyo")),
    GazetteerEntry("Cotorro", ("cotorro",)),
]


# ---------- REPARTOS / CIRCUITOS COMUNES (ampliable) ---------- #

CIRCUITS_REPARTOS: list[GazetteerEntry] = [
    GazetteerEntry("Párraga", ("parraga",)),
    GazetteerEntry("Porvenir", ("porvenir",)),
    GazetteerEntry("La Esperanza", ("la esperanza", "esperanza")),
    GazetteerEntry("Alcázar", ("alcazar",)),
    GazetteerEntry("Capri", ("capri",)),
    GazetteerEntry("La Cumbre", ("la cumbre", "cumbre")),
    GazetteerEntry("Dolores", ("dolores",)),
    GazetteerEntry("San Matías", ("san matias",)),
    GazetteerEntry("Tejas", ("tejas",)),
    GazetteerEntry("California", ("california",)),
    GazetteerEntry("Vedado", ("vedado",)),
    GazetteerEntry("Miramar", ("miramar",)),
    GazetteerEntry("Lawton", ("lawton",)),
    GazetteerEntry("Luyanó", ("luyano",)),
    GazetteerEntry("La Víbora", ("la vibora", "vibora")),
    GazetteerEntry("Santos Suárez", ("santos suarez",)),
    GazetteerEntry("Casino Deportivo", ("casino deportivo",)),
    GazetteerEntry("Sevillano", ("sevillano",)),
    GazetteerEntry("Mantilla", ("mantilla",)),
    GazetteerEntry("Calabazar", ("calabazar",)),
    GazetteerEntry("Bauta", ("bauta",)),
    GazetteerEntry("Alamar", ("alamar",)),
    GazetteerEntry("Cojímar", ("cojimar",)),
    GazetteerEntry("Guanabo", ("guanabo",)),
    GazetteerEntry("Santa Fe", ("santa fe",)),
    GazetteerEntry("Jaimanitas", ("jaimanitas",)),
]


# ---------- CENTRALES TERMOELÉCTRICAS Y UNIDADES ---------- #

THERMAL_PLANTS_CUBA: list[GazetteerEntry] = [
    GazetteerEntry(
        "CTE Antonio Guiteras",
        ("cte antonio guiteras", "antonio guiteras", "guiteras", "cte guiteras"),
        extra={"city": "Matanzas"},
    ),
    GazetteerEntry(
        "CTE Lidio Ramón Pérez (Felton)",
        ("cte lidio ramon perez", "lidio ramon perez", "felton", "cte felton"),
        extra={"city": "Holguín"},
    ),
    GazetteerEntry(
        "CTE 10 de Octubre (Nuevitas)",
        ("cte 10 de octubre", "cte diez de octubre", "nuevitas", "cte nuevitas"),
        extra={"city": "Camagüey"},
    ),
    GazetteerEntry(
        "CTE Carlos Manuel de Céspedes (Cienfuegos)",
        (
            "cte carlos manuel de cespedes",
            "carlos manuel de cespedes",
            "cespedes",
            "cte cespedes",
            "cte cienfuegos",
        ),
        extra={"city": "Cienfuegos"},
    ),
    GazetteerEntry(
        "CTE Antonio Maceo (Renté)",
        ("cte antonio maceo", "antonio maceo", "rente", "cte rente"),
        extra={"city": "Santiago de Cuba"},
    ),
    GazetteerEntry(
        "CTE Máximo Gómez (Mariel)",
        ("cte maximo gomez", "maximo gomez", "mariel", "cte mariel"),
        extra={"city": "Artemisa"},
    ),
    GazetteerEntry(
        "CTE Otto Parellada (Tallapiedra)",
        ("cte otto parellada", "otto parellada", "tallapiedra", "cte tallapiedra"),
        extra={"city": "La Habana"},
    ),
    GazetteerEntry(
        "CTE Ernesto Che Guevara",
        ("cte ernesto che guevara", "ernesto che guevara", "che guevara"),
        extra={"city": "Matanzas"},
    ),
]


# Unit patterns: e.g. "Felton 1", "Felton 2", "Renté 5", "Guiteras"
# We expand on the fly in the matcher: each plant + (1..8) and the bare canonical.
def _build_thermal_units() -> list[GazetteerEntry]:
    units: list[GazetteerEntry] = []
    for plant in THERMAL_PLANTS_CUBA:
        bare = plant.aliases[0] if plant.aliases else plant.canonical.lower()
        # Find a short alias (last word) for unit numbering
        short_aliases = []
        for a in plant.aliases:
            tokens = a.split()
            if tokens:
                short_aliases.append(tokens[-1])
        short_aliases = list(dict.fromkeys(short_aliases))[:3]
        for n in range(1, 9):
            forms = tuple(f"{sa} {n}" for sa in short_aliases) + (
                f"{plant.canonical} {n}",
                f"{plant.canonical} U{n}",
            )
            units.append(
                GazetteerEntry(
                    canonical=f"{plant.canonical} U{n}",
                    aliases=forms,
                    extra={"plant": plant.canonical, "unit_number": n},
                )
            )
    return units


THERMAL_UNITS: list[GazetteerEntry] = _build_thermal_units()


# ---------- PRECOMPILED MATCHERS ---------- #


def _compile_matcher(entries: list[GazetteerEntry]) -> list[tuple[GazetteerEntry, re.Pattern]]:
    """
    Builds (entry, compiled_regex) pairs. Pattern matches any alias as a whole
    word run on the normalized text. Longer aliases are tried first to prefer
    "diez de octubre" over "octubre".
    """
    compiled: list[tuple[GazetteerEntry, re.Pattern]] = []
    for entry in entries:
        forms = sorted(set(_normalize(f) for f in entry.all_forms()), key=len, reverse=True)
        forms = [f for f in forms if f]
        if not forms:
            continue
        alternation = "|".join(re.escape(f) for f in forms)
        pattern = re.compile(rf"\b(?:{alternation})\b")
        compiled.append((entry, pattern))
    return compiled


_PROVINCES_MATCHER = _compile_matcher(PROVINCES_CUBA)
_MUNICIPALITIES_MATCHER = _compile_matcher(MUNICIPALITIES_HAVANA)
_CIRCUITS_MATCHER = _compile_matcher(CIRCUITS_REPARTOS)
_THERMAL_PLANTS_MATCHER = _compile_matcher(THERMAL_PLANTS_CUBA)
_THERMAL_UNITS_MATCHER = _compile_matcher(THERMAL_UNITS)


def _run_matcher(
    matcher: list[tuple[GazetteerEntry, re.Pattern]],
    text_normalized: str,
) -> list[tuple[str, dict]]:
    """Returns list of (canonical, extra) for entries whose any alias matched."""
    found: list[tuple[str, dict]] = []
    seen: set[str] = set()
    for entry, pattern in matcher:
        if entry.canonical in seen:
            continue
        if pattern.search(text_normalized):
            found.append((entry.canonical, dict(entry.extra)))
            seen.add(entry.canonical)
    return found


def match_provinces(text: str) -> list[str]:
    return [c for c, _ in _run_matcher(_PROVINCES_MATCHER, _normalize(text))]


def match_municipalities(text: str) -> list[str]:
    return [c for c, _ in _run_matcher(_MUNICIPALITIES_MATCHER, _normalize(text))]


def match_circuits(text: str) -> list[str]:
    return [c for c, _ in _run_matcher(_CIRCUITS_MATCHER, _normalize(text))]


def match_thermal_plants(text: str) -> list[dict]:
    """Returns list of {canonical, city, ...extra}."""
    return [{"canonical": c, **extra} for c, extra in _run_matcher(_THERMAL_PLANTS_MATCHER, _normalize(text))]


def match_thermal_units(text: str) -> list[dict]:
    """Returns list of {canonical, plant, unit_number}. Falls back to plant-only matches."""
    norm = _normalize(text)
    units = [{"canonical": c, **extra} for c, extra in _run_matcher(_THERMAL_UNITS_MATCHER, norm)]
    if units:
        return units
    return [{"canonical": p["canonical"], "plant": p["canonical"]} for p in match_thermal_plants(text)]


def normalize_text(text: str) -> str:
    """Public version of the internal normalizer for use elsewhere in the AI module."""
    return _normalize(text)
