import {MessageType, YearTheme} from './types.ts';

export const YEAR_THEMES: Record<number, YearTheme> = {
    2022: {bg: 'bg-blue-50', primary: 'bg-blue-500', secondary: 'bg-blue-300', accent: 'text-blue-600'},
    2023: {bg: 'bg-green-50', primary: 'bg-green-500', secondary: 'bg-green-300', accent: 'text-green-600'},
    2024: {bg: 'bg-purple-50', primary: 'bg-purple-500', secondary: 'bg-purple-300', accent: 'text-purple-600'},
    2025: {bg: 'bg-orange-50', primary: 'bg-orange-500', secondary: 'bg-orange-300', accent: 'text-orange-600'},
    2026: {bg: 'bg-rose-50', primary: 'bg-rose-500', secondary: 'bg-rose-300', accent: 'text-rose-600'},
    2027: {bg: 'bg-teal-50', primary: 'bg-teal-500', secondary: 'bg-teal-300', accent: 'text-teal-600'},
    2028: {bg: 'bg-slate-50', primary: 'bg-slate-500', secondary: 'bg-slate-300', accent: 'text-slate-600'},
    2029: {bg: 'bg-violet-50', primary: 'bg-violet-500', secondary: 'bg-violet-300', accent: 'text-violet-600'},
    2030: {bg: 'bg-stone-50', primary: 'bg-stone-500', secondary: 'bg-stone-300', accent: 'text-stone-600'},
};

export const AVAILABLE_YEARS = [2022, 2023, 2024, 2025, 2026];

export const MESSAGE_TYPE_LABELS: Record<number, string> = {
    [MessageType.GENERAL_INFORMATION]: "Información General",
    [MessageType.DAF]: "DAF",
    [MessageType.FAILURE_BY_ZONE]: "Afectaciones por Zonas",
    [MessageType.DAILY_RESUME]: "Resumen Diario",
    [MessageType.BLOCK_INFORMATION]: "Afectaciones de Bloques",
};

export const MESSAGE_TYPE_DESCRIPTIONS: Record<number, string> = {
    [MessageType.GENERAL_INFORMATION]: "Noticias generales, mantenimientos planificados, avisos institucionales y otras informaciones de interés.",
    [MessageType.DAF]: "Disparado Automático por Frecuencia (DAF) 🤷‍♂️",
    [MessageType.FAILURE_BY_ZONE]: "Reportes específicos de averías o interrupciones en municipios, repartos o zonas determinadas.",
    [MessageType.DAILY_RESUME]: "Resumen estadístico y descriptivo del comportamiento del servicio eléctrico durante el día anterior.",
    [MessageType.BLOCK_INFORMATION]: "Información relacionada con la programación, rotación y afectación de los bloques de apagón.",
};

// ---- AI 15-category labels (Spanish) ---- //
export const AI_CATEGORY_LABELS: Record<string, string> = {
    sen_failure:           "Desconexión total del SEN",
    sen_recovery:          "Restablecimiento del SEN",
    block_affectation:     "Afectación de bloque",
    block_recovery:        "Restablecimiento de bloque",
    circuit_failure:       "Falla de circuito local",
    zone_outage:           "Afectación zonal",
    zone_recovery:         "Recuperación zonal",
    daily_resume:          "Resumen diario",
    daily_forecast:        "Pronóstico diario",
    daf:                   "Disparado Automático",
    thermal_unit_status:   "Estado unidad termoeléctrica",
    scheduled_maintenance: "Mantenimiento programado",
    weather_impact:        "Impacto meteorológico",
    apology_communication: "Comunicación / disculpa",
    general_info:          "Información general",
};

export const AI_CATEGORY_DESCRIPTIONS: Record<string, string> = {
    sen_failure:           "Apagón nacional o desconexión total del Sistema Electroenergético Nacional.",
    sen_recovery:          "Avance porcentual o conclusión del restablecimiento tras un apagón total.",
    block_affectation:     "Anuncio de afectación, déficit o salida de servicio de uno o varios bloques de carga (1-6).",
    block_recovery:        "Restablecimiento total o parcial del servicio en uno o más bloques.",
    circuit_failure:       "Avería primaria/secundaria, transformadores dañados o disparo de circuito local.",
    zone_outage:           "Corte por zona, reparto o municipio sin clasificarse como bloque.",
    zone_recovery:         "Recuperación de servicio en una zona, reparto o municipio específico.",
    daily_resume:          "Balance retrospectivo del día anterior con cifras de demanda/disponibilidad.",
    daily_forecast:        "Parte operativo del día con estimaciones de demanda máxima y déficit.",
    daf:                   "Corte súbito por inestabilidad de frecuencia (DAF).",
    thermal_unit_status:   "Salida, entrada o sincronización de una unidad termoeléctrica.",
    scheduled_maintenance: "Mantenimiento o trabajo programado anunciado con anticipación.",
    weather_impact:        "Afectación atribuida a clima: lluvia, viento, descargas, ciclón.",
    apology_communication: "Disculpas o información sobre canales de atención al cliente.",
    general_info:          "Aviso general institucional sin reportar un evento operativo concreto.",
};

export const AI_CATEGORY_BG_COLORS: Record<string, string> = {
    sen_failure:           "bg-red-600",
    sen_recovery:          "bg-emerald-500",
    block_affectation:     "bg-orange-500",
    block_recovery:        "bg-lime-500",
    circuit_failure:       "bg-amber-500",
    zone_outage:           "bg-yellow-500",
    zone_recovery:         "bg-teal-400",
    daily_resume:          "bg-sky-400",
    daily_forecast:        "bg-indigo-400",
    daf:                   "bg-fuchsia-500",
    thermal_unit_status:   "bg-violet-500",
    scheduled_maintenance: "bg-cyan-400",
    weather_impact:        "bg-blue-400",
    apology_communication: "bg-pink-300",
    general_info:          "bg-gray-300",
};

export const SEVERITY_BG: Record<string, string> = {
    low:      "bg-gray-200",
    medium:   "bg-yellow-300",
    high:     "bg-orange-500",
    critical: "bg-red-600",
};

export const SEVERITY_LABEL: Record<string, string> = {
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
    critical: "Crítico",
};

// ---- Cuban provinces with rough geography for the SVG map ---- //
// width 100 x height 40 base SVG box. Coordinates are approximations,
// good enough for a stylized neobrutal map (not cartographically accurate).
export const CUBA_PROVINCES_GEOM: Array<{
    canonical: string;
    label: string;
    x: number; y: number; w: number; h: number;
}> = [
    { canonical: "Pinar del Río",       label: "PIN",  x: 2,  y: 18, w: 11, h: 7 },
    { canonical: "Artemisa",            label: "ART",  x: 13, y: 17, w: 6,  h: 7 },
    { canonical: "La Habana",           label: "HAB",  x: 19, y: 15, w: 5,  h: 5 },
    { canonical: "Mayabeque",           label: "MAY",  x: 21, y: 19, w: 5,  h: 5 },
    { canonical: "Matanzas",            label: "MTZ",  x: 24, y: 16, w: 11, h: 8 },
    { canonical: "Villa Clara",         label: "VCL",  x: 35, y: 16, w: 8,  h: 8 },
    { canonical: "Cienfuegos",          label: "CFG",  x: 35, y: 22, w: 6,  h: 6 },
    { canonical: "Sancti Spíritus",     label: "SSP",  x: 41, y: 18, w: 7,  h: 9 },
    { canonical: "Ciego de Ávila",      label: "CAV",  x: 48, y: 19, w: 6,  h: 8 },
    { canonical: "Camagüey",            label: "CMG",  x: 53, y: 20, w: 10, h: 9 },
    { canonical: "Las Tunas",           label: "LTU",  x: 62, y: 22, w: 7,  h: 8 },
    { canonical: "Holguín",             label: "HLG",  x: 68, y: 22, w: 8,  h: 9 },
    { canonical: "Granma",              label: "GRA",  x: 65, y: 28, w: 7,  h: 7 },
    { canonical: "Santiago de Cuba",    label: "SCU",  x: 74, y: 28, w: 7,  h: 7 },
    { canonical: "Guantánamo",          label: "GTM",  x: 81, y: 26, w: 8,  h: 8 },
    { canonical: "Isla de la Juventud", label: "IJV",  x: 14, y: 27, w: 5,  h: 4 },
];

// Havana municipalities — used for a 5×3 grid in the local map.
export const HAVANA_MUNICIPALITIES_ORDER: string[] = [
    "Playa", "Plaza de la Revolución", "Centro Habana",
    "Habana Vieja", "Regla", "Habana del Este",
    "Marianao", "La Lisa", "Boyeros",
    "Cerro", "Diez de Octubre", "San Miguel del Padrón",
    "Guanabacoa", "Arroyo Naranjo", "Cotorro",
];