# ⚡ UNE Unwrapped - Resumen Eléctrico de La Habana

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.13" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite 3" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" alt="Vercel" />
</div>

<div align="center">
  <h3>
    <a href="https://une-unwrapped-habana.vercel.app" target="_blank">Demo en Vivo</a> |
    <a href="#descripción">Descripción</a> |
    <a href="#instalación">Instalación</a>
  </h3>
</div>

<div align="center">
  <p>Una plataforma interactiva para visualizar y analizar el resumen anual de la situación eléctrica en La Habana, de acuerdo con el canal oficial de Telegram de la UNE.</p>
</div>

![logo](/app/public/banner.webp)

## 📝 Descripción

Si plataformas como Spotify, GitHub o YouTube tienen su propio resumen anual
para mostrar estadísticas, siempre me pregunté por qué la UNE no podría
tener algo parecido. Con esa idea en mente, decidí crear este proyecto
para visualizar los datos del servicio eléctrico en La Habana de una forma
más clara y accesible.

El proceso empezó scrapeando [el canal de Telegram de la UNE en La Habana](https://t.me/EmpresaElectricaDeLaHabana), 
de donde extraje todo [el histórico de mensajes](telegram_messages.db) con sus respectivos metadatos.
Después, programé un script para procesar esa información y generar los 
[análisis anuales en formato JSON](/app/public/data/analysis_data_2025.json), desglosando los datos en varios puntos clave.

Finalmente, desarrollé una aplicación web con una estética neobrutalista
para presentar estos resultados de una manera mucho más amigable y visual.
Puedes ver el resultado final funcionando en [este enlace](https://une-unwrapped-habana.vercel.app).

> [!WARNING]
> Los resúmenes anuales de los datos extraídos no deben tomarse como 
> oficialmente válidos. El sistema busca patrones en los mensajes y no
> realiza un análisis técnico profundo. Úsalos solo con fines de entretenimiento.
> Si logras analizar los datos de forma más técnica con minería de datos o IA haz PR para mejorar el proyecto.

El proyecto está montado como un monorepo donde conviven backend (Python) y frontend (React).
Por un lado, el backend se encarga de scrapear los mensajes de Telegram,
procesarlos y meterlos en una base de datos SQLite para que no se
pierda nada (y poder cachear mensajes antiguos). Además, genera
unos archivos `.json` anuales con todo el análisis detallado,
que son básicamente el motor que alimenta lo que se ve en la web.

El frontend es en React y Vite. La web tiene una 
estética neobrutalista, con esa personalidad fuerte y directa, ideal
para mostrar las métricas y los datos clave de manera clara, pero
con un estilo visual que rompe un poco con el flat design de siempre.

## 🚀 Demo en Vivo

La aplicación está desplegada y disponible en: [une-unwrapped-habana.vercel.app](https://une-unwrapped-habana.vercel.app/)

## 📥 Instalación

### Backend

#### Requisitos Previos
- Python 3.13.x o superior
- pip

#### Pasos para Instalación y Uso Local

1. **Clonar el repositorio**
>   ```bash
>   git clone https://github.com/EduardoProfe666/une-unwrapped-habana.git
>   cd une-unwrapped-habana
>   ```

2. **Instalar dependencias**
>   ```bash
>   pip install -r requirements.txt
>   ```

3. **Obtener credenciales para Telethon**
> Para obtener las credenciales necesarias refierete a [este enlace en su documentación](https://docs.telethon.dev/en/stable/basic/signing-in.html)

4. **Obtener session string para Telethon**
>   Una vez con el `API_ID` y `API_HASH`, es necesario obtener el `API_SESSION`.
>   ```bash
>   cd core
>   python session_manager.py
>   ```
>   Luego rellena con tu número de teléfono registrado en la cuenta de Telegram (con prefijo incluido Ej. +53XXXXXXXX).
>   
>   Copia el string que se imprime por consola, este es el `API_SESSION`.

5. **Configurar variables de entorno**
> Crea un archivo `.env` en la raíz del proyecto con las variables que aparecen en `.env.example`

6. **Correr el proyecto para empezar a sincronizar**
>   ```bash
>   python main.py
>   ```
>   Si no hay datos, o están muy desactualizados, a lo mejor conveniene cargar todos los mensajes, en lugar de solo los últimos.
>   Para ello descomenta la siguiente línea en `main.py`
>   ```python
>   # process_all_messages()
>   ```

### Frontend

#### Requisitos Previos
- Node.js 22.x o superior
- npm/pnpm/yarn/bun (Preferiblemente bun)


#### Pasos para Instalación y Uso Local

1. **Clonar el repositorio**
>   ```bash
>   git clone https://github.com/EduardoProfe666/une-unwrapped-habana.git
>   cd une-unwrapped-habana
>   cd app
>   ```

2. **Instalar dependencias**
>   ```bash
>   npm install
>   # o
>   yarn install
>   # o
>   pnpm install
>   # o
>   bun install
>   ```
   
3. **Configurar variables de entorno**
> Crea un archivo `.env` en la raíz del proyecto con las variables que aparecen en `.env.example`

4. **Iniciar el servidor de desarrollo**
>   ```bash
>   npm run dev
>   # o
>   yarn dev
>   # o
>   pnpm run dev
>   # o
>   bun run dev
>   ```
   
5. **Acceder a la aplicación**
> Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Para contribuir:

1. Haz un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios y haz commit (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.