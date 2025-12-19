import {UneAnalysis, YearTheme, MessageType} from './types';

export const YEAR_THEMES: Record<number, YearTheme> = {
    2022: {bg: 'bg-blue-50', primary: 'bg-blue-500', secondary: 'bg-blue-300', accent: 'text-blue-600'},
    2023: {bg: 'bg-green-50', primary: 'bg-green-500', secondary: 'bg-green-300', accent: 'text-green-600'},
    2024: {bg: 'bg-purple-50', primary: 'bg-purple-500', secondary: 'bg-purple-300', accent: 'text-purple-600'},
    2025: {bg: 'bg-orange-50', primary: 'bg-orange-500', secondary: 'bg-orange-300', accent: 'text-orange-600'},
    2026: {bg: 'bg-pink-50', primary: 'bg-pink-500', secondary: 'bg-pink-300', accent: 'text-pink-600'},
    2027: {bg: 'bg-teal-50', primary: 'bg-teal-500', secondary: 'bg-teal-300', accent: 'text-teal-600'},
};

export const MESSAGE_TYPE_LABELS: Record<number, string> = {
    [MessageType.GENERAL_INFORMATION]: "Información General",
    [MessageType.DAF]: "DAF",
    [MessageType.FAILURE_BY_ZONE]: "Afectaciones por Zonas",
    [MessageType.DAILY_RESUME]: "Resumen Diario",
    [MessageType.BLOCK_INFORMATION]: "Afectaciones de Bloques",
};

export const MESSAGE_TYPE_DESCRIPTIONS: Record<number, string> = {
    [MessageType.GENERAL_INFORMATION]: "Noticias generales, mantenimientos planificados, avisos institucionales y otras informaciones de interés.",
    [MessageType.DAF]: "🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️",
    [MessageType.FAILURE_BY_ZONE]: "Reportes específicos de averías o interrupciones en municipios, repartos o zonas determinadas.",
    [MessageType.DAILY_RESUME]: "Resumen estadístico y descriptivo del comportamiento del servicio eléctrico durante el día anterior.",
    [MessageType.BLOCK_INFORMATION]: "Información relacionada con la programación, rotación y afectación de los bloques de apagón.",
};