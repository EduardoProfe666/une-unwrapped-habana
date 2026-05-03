# ⚡ UNE Unwrapped - Resumen Eléctrico de La Habana

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.13" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite 3" />
  <img src="https://img.shields.io/badge/HuggingFace-Transformers-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="HuggingFace" />
  <img src="https://img.shields.io/badge/ONNX-Runtime-005CED?style=for-the-badge&logo=onnx&logoColor=white" alt="ONNX Runtime" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-12-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" alt="Vercel" />
</div>

<div align="center">
  <h3>
    <a href="https://une-unwrapped.vercel.app" target="_blank">Demo en Vivo</a> |
    <a href="#-descripción">Descripción</a> |
    <a href="#-cómo-funciona">Cómo funciona</a> |
    <a href="#-instalación">Instalación</a> |
    <a href="#%EF%B8%8F-disclaimer-sobre-los-datos">Disclaimer</a>
  </h3>
</div>

<div align="center">
  <p>Una plataforma interactiva para visualizar y analizar el resumen anual de la situación eléctrica en La Habana, alimentada por el canal oficial de Telegram de la UNE y enriquecida con un pipeline de IA local que clasifica cada mensaje y extrae metadata estructurada.</p>
</div>

![logo](/app/public/banner.png)

## 📝 Descripción

Si plataformas como Spotify, GitHub o YouTube tienen su propio resumen anual
para mostrar estadísticas, siempre me pregunté por qué la UNE no podría
tener algo parecido. Con esa idea en mente, decidí crear este proyecto
para visualizar los datos del servicio eléctrico en La Habana de una forma
más clara y accesible.

El proceso empieza scrapeando [el canal de Telegram de la UNE en La Habana](https://t.me/EmpresaElectricaDeLaHabana),
de donde se extrae todo [el histórico de mensajes](telegram_messages.db) con sus respectivos metadatos.
Después, una capa de **IA local** (sin APIs externas) clasifica cada mensaje
en una de 15 categorías y extrae metadata estructurada — bloques afectados,
provincias, municipios, MW de déficit, horarios, unidades termoeléctricas
mencionadas, severidad del evento, etc. Toda esa información se combina con
heurísticas deterministas (regex calibradas) para generar
[análisis anuales en formato JSON](/app/public/data/analysis_data_2025.json),
que son el motor de la web.

Finalmente, una aplicación web con estética **neobrutalista** presenta esos
resultados en más de 30 visualizaciones interactivas — desde un Health Score
del año al estilo wrapped, pasando por radares por bloque, calendarios de
severidad, mapas de afectación geográfica, hasta un *Apagómetro* que predice
basado en el ritmo histórico. Está disponible en
**[une-unwrapped.vercel.app](https://une-unwrapped.vercel.app)**.

El proyecto está montado como un **monorepo** donde conviven backend (Python)
y frontend (React). El backend scrapea Telegram, persiste los mensajes en
SQLite, los procesa con IA y genera los `.json` anuales. El frontend, en React
19 + Vite + Tailwind 4, los consume y los renderiza con animaciones de
framer-motion sobre una identidad visual fuerte y directa.

## 🚀 Demo en Vivo

La aplicación está desplegada y disponible en: [une-unwrapped.vercel.app](https://une-unwrapped.vercel.app/)

Sincronización automática cada hora vía GitHub Actions (`.github/workflows/sync.yml`):
nuevos mensajes → IA incremental (200 msgs/run) → analyzer → commit del JSON +
SQLite → deploy en Vercel.

## ⚙️ Cómo funciona

### Pipeline de datos end-to-end

```
   Telegram (UNE Habana)
            │
            ▼
   ┌──────────────────┐
   │  Telethon scraper │  → core/scrapper.py
   └──────────────────┘
            │
            ▼
   ┌──────────────────┐
   │ SQLite (messages) │  → telegram_messages.db
   └──────────────────┘
            │
            ▼
   ┌────────────────────────────────────┐
   │  Capa de IA — core/ai/             │
   │  • zero-shot mDeBERTa (clasifica)  │
   │  • NER BETO español (extrae)       │
   │  • gazetteer (provincias/CTEs)     │
   │  • regex extractors (MW, horarios) │
   │  • severity / event_type / summary │
   └────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────┐
   │ SQLite (message_ai_analysis)    │
   └────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────┐
   │  Analyzer — core/analyzer.py    │
   │  combina datos legacy + AI      │
   └────────────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────┐
   │  app/public/data/analysis_<year>.json│
   └─────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ React + Vite (frontend) │ → 30+ visualizaciones
   └────────────────────────┘
```

### 🤖 Capa de IA (`core/ai/`)

A diferencia del análisis original (que dependía solo de regex frágiles),
ahora cada mensaje pasa por un pipeline de IA **100% local** — sin APIs
externas, sin costos por uso, sin enviar datos a terceros:

| Etapa | Modelo / técnica | Propósito |
|---|---|---|
| Clasificación | [`MoritzLaurer/mDeBERTa-v3-base-mnli-xnli`](https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-mnli-xnli) (zero-shot) | Asigna 1 de 15 categorías + subcategorías |
| NER | [`mrm8488/bert-spanish-cased-finetuned-ner`](https://huggingface.co/mrm8488/bert-spanish-cased-finetuned-ner) (BETO) | Detecta lugares, organizaciones, personas |
| Gazetteer | Catálogos hardcoded | Resuelve provincias cubanas, municipios habaneros, centrales termoeléctricas y sus unidades |
| Regex extractors | Determinista | MW (déficit/demanda/disponibilidad), horarios (`10:00 a 14:00`), bloques (afectados vs recuperados) |
| Heurísticas | Plantillas | Deriva `severity` (low/medium/high/critical), `event_type` y un `summary` resumido |

#### Las 15 categorías

`sen_failure`, `sen_recovery`, `block_affectation`, `block_recovery`,
`circuit_failure`, `zone_outage`, `zone_recovery`, `daily_resume`,
`daily_forecast`, `daf` (Disparado Automático por Frecuencia),
`thermal_unit_status`, `scheduled_maintenance`, `weather_impact`,
`apology_communication`, `general_info`.

Definidas en [`core/ai/taxonomy.py`](core/ai/taxonomy.py) con su hipótesis
en español usada por el zero-shot.

#### Selección automática de backend según hardware

| Backend | Cuándo se usa | Velocidad típica | Memoria |
|---|---|---|---|
| **PyTorch + CUDA fp16** | GPU disponible (Colab T4, máquina con CUDA) | ~5–10 ms/msg | ~2 GB VRAM |
| **ONNX Runtime int8** | Solo CPU (GitHub Actions, laptops sin GPU) | ~250 ms/msg | ~1.5 GB RAM |

Se puede forzar vía la variable de entorno `UNE_AI_BACKEND=gpu|cpu`.
La cuantización int8 se hace una vez en el primer arranque y se cachea.

### 📊 Analyzer — combina datos legacy + IA

[`core/analyzer.py`](core/analyzer.py) genera los JSON anuales con:

- **Métricas base**: total de mensajes, reacciones, vistas, primer/último mensaje.
- **Análisis por bloque (1–6)**: menciones, afectaciones declaradas, recuperaciones, segundos estimados sin servicio.
- **Análisis del SEN**: eventos de desconexión total, duraciones estimadas, peor día.
- **Distribuciones**: por categoría IA, por tipo de evento, por severidad.
- **Geografía**: zonas afectadas (provincias, municipios, repartos) con ranking.
- **Power timeline**: serie temporal de demanda / disponibilidad / déficit en MW.
- **Events timeline**: eventos relevantes (severity ≥ medium) cronológicos, deduplicados.
- **Centrales termoeléctricas**: ranking de menciones / fallos por planta y unidad.
- **Health Score**: puntuación 0–100 derivada del año.
- **Hitos**: día más calmo, peor día, racha más larga sin afectaciones.

### 🎨 Frontend — 30+ visualizaciones

Agrupadas en 7 secciones (ver el [`NavigationHub`](app/src/components/NavigationHub.tsx)):

<details>
<summary><b>01_WRAPPED</b> — Resumen narrativo del año</summary>

- **Year Wrapped** · resumen al estilo Spotify Wrapped
- **Histórico Global** · agregado de todos los años: récord histórico, bloque más castigado, peor día absoluto, etc.
- **Health Score** · puntuación del año con desglose por dimensión
- **Hall of Fame** · récords personales (mensaje más largo, más reaccionado, etc.)
- **Contador del SEN** · días desde el último apagón total
- **Apagómetro** · predictor del próximo apagón basado en el ritmo histórico
</details>

<details>
<summary><b>02_MÉTRICAS_BASE</b></summary>

- Resumen General (totales del año)
- Medias por Mensaje
- Flujo de Mensajes (daily activity)
</details>

<details>
<summary><b>03_HITOS_DEL_AÑO</b></summary>

- Calendario de Severidad (heatmap anual)
- El Peor Día / El Día más Calmo
</details>

<details>
<summary><b>04_INFRAESTRUCTURA</b></summary>

- Resumen por Bloque (cards 1–6)
- Explorador de Bloques (vista detallada interactiva)
- Radar de Bloques (5 dimensiones por bloque, comparativa)
- Matriz Semanal (día × bloque)
- Estado del SEN
- Centrales Termoeléctricas (ranking)
</details>

<details>
<summary><b>05_GEOGRAFÍA_Y_RITMO</b></summary>

- Mapa de Afectaciones (provincias y municipios)
- Ritmo del Año (reloj de horas)
- Mapa Día × Hora (heatmap semanal)
</details>

<details>
<summary><b>06_ANÁLISIS_TEMPORAL</b></summary>

- Evolución Mensual
- Demanda vs Disponibilidad (power timeline)
- Marea de Categorías (streamgraph)
- Termómetro de Frustración (sentiment)
- Tipos de Mensajes (distribución)
- Espectro de Reacciones
</details>

<details>
<summary><b>07_SOCIAL_Y_TEXTO</b></summary>

- Nube de Conceptos (word cloud)
- Frases del Año (top quotes)
- Hitos Temporales (primer/último mensaje, etc.)
- Longitud Crítica (mensajes extremos)
- Rankings de Impacto (top lists)
</details>

Stack frontend: **React 19**, **Vite 7.3**, **TypeScript 5**, **Tailwind 4**,
**framer-motion 12**, **Recharts**, **lucide-react**, PWA con `vite-plugin-pwa`,
sitemap auto-generado en build.

## ⚠️ Disclaimer sobre los datos

> [!WARNING]
> **Los resúmenes anuales no deben tomarse como oficialmente válidos.** Son una
> reconstrucción aproximada basada en un canal de comunicación pública, no en
> datos operativos reales del SEN. Úsalos con fines informativos / de
> entretenimiento, no para decisiones técnicas.

Aunque la capa de IA mejora considerablemente la extracción comparada con el
parser regex original, **la fuente sigue siendo la misma — los mensajes de
Telegram de UNE Habana** — y arrastra las inconsistencias propias de esa
fuente:

- **Mensajes incompletos.** A veces se anuncia que se afecta un bloque pero
  nunca se reporta su recuperación. O al revés: aparece un restablecimiento
  sin haber visto antes el aviso de afectación. Esto puede inflar o desinflar
  los conteos en cualquier dirección.
- **Formato cambiante.** El estilo de los partes ha variado a lo largo de los
  años: a veces se reportan números exactos de MW, a veces se omiten; a veces
  se listan municipios, a veces sólo se dice "varias zonas".
- **Granularidad variable.** Algunos eventos se reportan por bloque, otros por
  zona, otros por circuito; reconciliar esas vistas requiere heurísticas
  imperfectas (por ejemplo, asumir un cap de 24 h por evento sin recuperación
  explícita).
- **Lenguaje natural ambiguo.** Aun con un modelo de lenguaje específico para
  español, hay frases con dobles negaciones, ironía o tipográficos que el
  clasificador puede categorizar incorrectamente. La distribución por
  categoría puede tener un error del orden de un par de puntos porcentuales.
- **Mensajes faltantes.** Si el canal estuvo caído un día — o si ese día
  hubo un apagón total que impidió publicar — se pierden eventos que
  ocurrieron pero nunca se reportaron.

**En consecuencia: el tiempo total sin luz, el conteo de afectaciones por
bloque, la geografía de afectados y los rankings de centrales termoeléctricas
son estimaciones**. Pueden errar tanto por encima como por debajo del valor
real, y algunas categorías (sobre todo las de baja frecuencia, como
`weather_impact` o `daf`) tienen mayor incertidumbre que otras.

Si te interesa mejorar la calidad de los datos — afinar la taxonomía, ampliar
el gazetteer, añadir reglas de reconciliación, etiquetar manualmente un eval
set más robusto — los PRs son bienvenidos.

## 🌟 Apoya el proyecto

Si este resumen te ha parecido interesante, útil o simplemente te gusta la iniciativa, ¡tu apoyo significa mucho!

- **Dale una estrella ⭐** en la esquina superior derecha del repo.
- **Comparte** la web (recordando siempre que los datos no son oficiales ni exactos).
- **Programa** y abre PRs con cualquier mejora — frontend, backend, o calibración del modelo.

## 📥 Instalación

### Backend

#### Requisitos previos
- Python ~= 3.13.x
- [`uv`](https://docs.astral.sh/uv/) ~= 0.9.x

#### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/EduardoProfe666/une-unwrapped-habana.git
   cd une-unwrapped-habana
   ```

2. **Instalar dependencias**
   ```bash
   uv sync
   ```
   Esto instala `telethon`, `transformers`, `optimum[onnxruntime]`,
   `onnxruntime`, `torch`, `huggingface_hub`, etc.

3. **Obtener credenciales para Telethon**
   Sigue [la guía oficial](https://docs.telethon.dev/en/stable/basic/signing-in.html) para conseguir `API_ID` y `API_HASH`.

4. **Generar el `API_SESSION`**
   ```bash
   uv run python core/session_manager.py
   ```
   Introduce el número con prefijo (ej. `+53XXXXXXXX`). Copia el string que
   imprime — ese es tu `API_SESSION`.

5. **Configurar variables de entorno**
   Crea un `.env` en la raíz con las variables de `.env.example`.

6. **Sincronizar mensajes + IA + análisis**
   ```bash
   uv run python main.py
   ```
   El flujo de `main.py` es:
   - `process_latest_messages()` — scraper incremental.
   - `process_pending_ai_analysis(max_messages=200)` — IA incremental (cap por SLA).
   - `analyze_data(year)` por cada año — regenera los JSON.

   Si tu BD está vacía o muy desactualizada, descomenta esta línea en `main.py`:
   ```python
   # process_all_messages()
   ```

#### Procesamiento con IA

La capa de IA vive en [`core/ai/`](core/ai/) y se ejecuta automáticamente al
correr `main.py`. Si quieres correrla aislada — útil para backfill histórico
o para procesar un año específico:

**Backfill local (CPU, ONNX int8):**
```bash
uv run python scripts/backfill_ai.py --year 2024 --max-messages 500 --batch-size 64
```

**Backfill completo en Google Colab GPU (recomendado para histórico de ~60k mensajes):**
1. Abre [`notebooks/backfill_ai_colab.ipynb`](notebooks/backfill_ai_colab.ipynb) en Colab.
2. `Entorno de ejecución` → GPU (T4).
3. Ejecuta todas las celdas: clona el repo, descarga modelos, procesa todo el histórico (~6–12 min en T4) y descarga un zip con `telegram_messages.db` y los JSONs.
4. En tu máquina, aplica los resultados:
   ```bash
   python scripts/apply_colab_results.py /ruta/a/une_backfill_<ts>.zip
   ```
5. Revisa `git diff` y commitea cuando estés conforme.

**Backfill desde GitHub Actions:**
- [`.github/workflows/backfill-ai.yml`](.github/workflows/backfill-ai.yml) (manual via *Run workflow*). Soporta matrix por año (2022–2026) o un año específico, con cache HuggingFace para evitar re-descargas.
- [`.github/workflows/sync.yml`](.github/workflows/sync.yml) corre el procesamiento incremental cada hora.

**Evaluación cualitativa del modelo:**
```bash
uv run python -m core.ai.eval
```
Corre un set anotado manualmente y reporta precisión/recall por campo.

### Frontend

#### Requisitos previos
- Node ~= 22.x
- [Bun](https://bun.sh) ~= 1.3.x

#### Pasos

1. **Entrar a la app**
   ```bash
   cd app
   ```

2. **Instalar dependencias**
   ```bash
   bun install
   ```

3. **Configurar variables de entorno**
   Crea un `.env` con las variables de `.env.example`.

4. **Iniciar el servidor de desarrollo**
   ```bash
   bun dev
   ```

5. **Acceder**
   [http://localhost:5173](http://localhost:5173)

6. **Build de producción**
   ```bash
   bun run build
   ```
   Esto genera el sitemap, hace el build de Vite y deja todo en `dist/`.

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Para contribuir:

1. Haz un fork del repositorio.
2. Crea una rama (`git checkout -b feature/amazing-feature`).
3. Realiza tus cambios y haz commit (`git commit -m 'Add some amazing feature'`).
4. Push a la rama (`git push origin feature/amazing-feature`).
5. Abre un Pull Request.

Áreas con mucho margen de mejora:
- **Calibración del modelo de IA** (umbrales por categoría, ampliar el set de evaluación).
- **Gazetteer** (más repartos, alias de centrales termoeléctricas, etc.).
- **Reconciliación de eventos** (matching de afectaciones con sus recuperaciones cuando los mensajes lo permitan).
- **Nuevas visualizaciones** o mejoras de las existentes.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT — ver [LICENSE](LICENSE).
