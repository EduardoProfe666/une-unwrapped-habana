import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence, Variants} from 'framer-motion';
import {
    YEAR_THEMES,
    MESSAGE_TYPE_LABELS,
    MESSAGE_TYPE_DESCRIPTIONS
} from './constants';
import {UneAnalysis, MessageType} from './types';
import {formatNumber} from './utils';
import {TelegramMessage} from './components/TelegramMessage';
import {ChartSection} from './components/ChartSection';
import {WordCloud} from './components/WordCloud';
import {SenAnalysisSection} from './components/SenAnalysis';
import {BlockCard} from './components/BlockCard';
import {Info, HelpCircle, Terminal, TrendingUp, ThumbsUp, ThumbsDown, MessageSquare} from 'lucide-react';
import {Analytics} from "@vercel/analytics/react";
import {SpeedInsights} from "@vercel/speed-insights/react";

const availableYears = [2022, 2023, 2024, 2025];

function App() {
    const [selectedYear, setSelectedYear] = useState<number>(2025);
    const [data, setData] = useState<UneAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    // Theme helper
    const theme = YEAR_THEMES[selectedYear] || YEAR_THEMES[2025];

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/data/analysis_data_${selectedYear}.json`, {signal});
                if (!response.ok) {
                    throw new Error(`Error al cargar los datos del año ${selectedYear}`);
                }
                const jsonData = await response.json();
                setData(jsonData);
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => controller.abort();
    }, [selectedYear]);

    // Framer Motion Variants
    const containerVariants: Variants = {
        hidden: {opacity: 0},
        visible: {opacity: 1, transition: {staggerChildren: 0.1}}
    };

    const itemVariants: Variants = {
        hidden: {y: 50, opacity: 0},
        visible: {y: 0, opacity: 1, transition: {type: 'spring', stiffness: 50}}
    };

    if (!data) return <div
        className="min-h-screen flex items-center justify-center font-bold text-2xl">Cargando...</div>;

    return (
        <div className={`min-h-screen ${theme.bg} text-black transition-colors duration-500 relative`}>

            {/* Sync Date Corner */}
            <div
                className="fixed top-0 right-0 p-2 z-50 bg-black text-white text-[10px] font-mono opacity-60 hover:opacity-100 transition-opacity">
                SYNC: {new Date(data.sync_date).toLocaleString()}
            </div>

            {/* Hero Section */}
            <header
                className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden border-b-4 border-black bg-white">
                <div className="absolute top-4 left-4 font-bold text-xl flex items-center gap-2">
                    <img src="/logo.png" alt="Logo"
                         className="h-10 w-10 p-0.5 rounded-full bg-gray-300 border-2 border-black"/>
                    UNE Unwrapped
                </div>

                <motion.div
                    initial={{scale: 0.8, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    transition={{duration: 0.5}}
                    className="text-center z-10"
                >
                    <h1 className="text-6xl md:text-9xl font-black mb-4 tracking-tighter">
                        {selectedYear}
                    </h1>
                    <p className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-8">
                        Resumen Eléctrico de La Habana
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center">
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`px-6 py-3 font-bold border-4 border-black text-lg transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_black] ${
                                    selectedYear === year ? `${theme.primary} text-white` : 'bg-white'
                                }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Hero Decor */}
                <div
                    className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full ${theme.secondary} opacity-50 blur-3xl`}></div>
                <div
                    className={`absolute top-20 right-20 w-40 h-40 rounded-full ${theme.primary} opacity-30 blur-2xl`}></div>
            </header>

            {/* Disclaimer Section */}
            <section
                className="bg-yellow-300 border-b-4 border-black p-4 text-center text-sm font-bold flex justify-center items-center gap-2">
                <HelpCircle size={18}/>
                <span>INFO: Datos extraídos automáticamente de Telegram. Tratados con algoritmos sencillos de análisis de texto. Solo para entretenimiento.</span>
            </section>

            {loading ? (
                <div className="h-96 flex items-center justify-center text-2xl font-black animate-pulse">
                    CARGANDO DATOS DEL {selectedYear}...
                </div>
            ) : (
                <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-24">

                    {/* TOTALS GRID */}
                    <motion.section
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{once: true, margin: "-100px"}}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {[
                            {label: 'Vistas Totales', value: data.total_views, icon: <TrendingUp/>},
                            {label: 'Mensajes', value: data.total_messages, icon: <MessageSquare/>},
                            {label: 'Reacciones', value: data.total_reactions, icon: <ThumbsUp/>},
                            {label: 'Comentarios', value: data.total_replies, icon: <MessageSquare/>},
                        ].map((stat, i) => (
                            <motion.div key={i} variants={itemVariants}
                                        className="bg-white neobrutal-border p-4 neobrutal-shadow flex flex-col justify-between h-32">
                                <div className="flex justify-between items-start text-gray-500">
                                    <span className="text-xs font-bold uppercase">{stat.label}</span>
                                    {stat.icon}
                                </div>
                                <span className="text-2xl md:text-4xl font-black truncate"
                                      title={stat.value.toLocaleString()}>
                        {stat.value >= 1000000 ? `${(stat.value / 1000000).toFixed(1)}M` : formatNumber(stat.value)}
                    </span>
                            </motion.div>
                        ))}
                    </motion.section>

                    {/* AVERAGES & TEXT STATS */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <motion.div
                            initial={{x: -50, opacity: 0}}
                            whileInView={{x: 0, opacity: 1}}
                            viewport={{once: true}}
                            className="bg-white neobrutal-border p-6 neobrutal-shadow-sm space-y-4"
                        >
                            <h2 className={`text-3xl font-black ${theme.accent} uppercase border-b-2 border-black pb-2`}>Promedios</h2>
                            <ul className="space-y-3 font-mono text-lg">
                                <li className="flex justify-between"><span>Vistas/Msg:</span>
                                    <b>{formatNumber(data.avg_views)}</b></li>
                                <li className="flex justify-between"><span>Reacciones/Msg:</span>
                                    <b>{data.avg_reactions}</b></li>
                                <li className="flex justify-between"><span>Longitud Texto:</span>
                                    <b>{data.avg_text_length} letras</b></li>
                                <li className="flex justify-between text-green-600"><span>👍 Avg:</span>
                                    <b>{data.avg_positive_reactions}</b></li>
                                <li className="flex justify-between text-red-600"><span>👎 Avg:</span>
                                    <b>{data.avg_negative_reactions}</b></li>
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{x: 50, opacity: 0}}
                            whileInView={{x: 0, opacity: 1}}
                            viewport={{once: true}}
                            className="space-y-10"
                        >
                            <div className="relative group">
                                <span
                                    className="absolute -rotate-3 -top-3 left-4 bg-black text-white px-2 text-xs font-bold z-20">PRIMER MENSAJE</span>
                                <TelegramMessage message={data.first_message}/>
                            </div>
                            <div className="relative group mt-12">
                                <span
                                    className="absolute -rotate-3 -top-3 left-4 bg-black text-white px-2 text-xs font-bold z-20">ÚLTIMO MENSAJE</span>
                                <TelegramMessage message={data.last_message}/>
                            </div>
                        </motion.div>
                    </section>

                    {/* MONTHLY CHARTS */}
                    <section>
                        <h2 className="text-4xl font-black mb-8 text-center bg-black text-white inline-block px-4 py-2 transform -rotate-2">
                            Tendencias Mensuales
                        </h2>
                        <ChartSection data={data} color={theme.accent}/>
                    </section>

                    {/* EXTREMES (Shortest/Longest) */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xl font-bold uppercase text-center">Mensaje Más Corto</h3>
                            <TelegramMessage message={data.shortest_message} className="border-green-500"/>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xl font-bold uppercase text-center">Mensaje Más Largo</h3>
                            <TelegramMessage message={data.longest_message} className="border-red-500"/>
                        </div>
                    </section>

                    {/* DISTRIBUTION */}
                    <section className="bg-white neobrutal-border p-8 neobrutal-shadow">
                        <h2 className="text-3xl font-black mb-6 uppercase">Tipos de Mensajes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                {Object.entries(data.distribution_message).map(([typeId, count]) => (
                                    <div key={typeId} className="flex items-center gap-2 group cursor-help relative">
                                        <div
                                            className="w-full bg-gray-100 h-10 rounded-none overflow-hidden relative border-2 border-black shadow-[2px_2px_0px_0px_black]">
                                            <div
                                                className={`h-full ${theme.primary} absolute top-0 left-0`}
                                                style={{width: `${((count as number) / data.total_messages) * 100}%`}}
                                            ></div>
                                            <span
                                                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 font-bold text-xs md:text-sm mix-blend-multiply uppercase">
                                    {MESSAGE_TYPE_LABELS[parseInt(typeId)] || `Tipo ${typeId}`}
                                </span>
                                            <span
                                                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 font-mono text-xs font-bold">
                                    {count as number}
                                </span>
                                        </div>

                                        {/* DAF Tooltip Logic (Generalized) */}
                                        <div
                                            className="hidden group-hover:flex absolute left-0 bottom-full bg-black text-white p-3 text-xs w-64 z-20 mb-2 border-2 border-white shadow-lg pointer-events-none">
                                            {MESSAGE_TYPE_DESCRIPTIONS[parseInt(typeId)] || "Sin descripción disponible."}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reaction Distribution */}
                            <div
                                className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-400 p-4">
                                <h3 className="font-bold mb-8 uppercase text-xl">Reacciones Totales</h3>
                                <div className="flex gap-12 items-end h-64 w-full justify-center px-4">

                                    {/* Barra Positiva */}
                                    <div
                                        className="flex flex-col items-center flex-1 h-full justify-end group relative">
                                        {/* Tooltip Estilo Neo-brutalista */}
                                        <div
                                            className="hidden group-hover:flex absolute left-1/2 -translate-x-1/2 bottom-full bg-black text-white p-3 text-xs w-48 z-20 mb-4 border-2 border-white shadow-lg pointer-events-none flex-col items-center text-center">
                                            <span
                                                className="font-black text-lg">{formatNumber(data.total_positive_reactions)}</span>
                                            <span>REACCIONES POSITIVAS</span>
                                        </div>

                                        <span
                                            className="font-black text-2xl mb-2">{((data.total_positive_reactions / data.total_reactions) * 100).toFixed(1)}%</span>
                                        <div
                                            style={{height: `${(data.total_positive_reactions / data.total_reactions) * 100}%`}}
                                            className="w-full max-w-[80px] bg-green-500 border-4 border-black min-h-[20px] shadow-[4px_4px_0px_0px_black] transition-all group-hover:-translate-y-1"
                                        ></div>
                                        <span className="text-4xl mt-4">👍</span>
                                    </div>

                                    {/* Barra Negativa */}
                                    <div
                                        className="flex flex-col items-center flex-1 h-full justify-end group relative">
                                        {/* Tooltip Estilo Neo-brutalista */}
                                        <div
                                            className="hidden group-hover:flex absolute left-1/2 -translate-x-1/2 bottom-full bg-black text-white p-3 text-xs w-48 z-20 mb-4 border-2 border-white shadow-lg pointer-events-none flex-col items-center text-center">
                                            <span
                                                className="font-black text-lg">{formatNumber(data.total_negative_reactions)}</span>
                                            <span>REACCIONES NEGATIVAS</span>
                                        </div>

                                        <span
                                            className="font-black text-2xl mb-2">{((data.total_negative_reactions / data.total_reactions) * 100).toFixed(1)}%</span>
                                        <div
                                            style={{height: `${(data.total_negative_reactions / data.total_reactions) * 100}%`}}
                                            className="w-full max-w-[80px] bg-red-500 border-4 border-black min-h-[20px] shadow-[4px_4px_0px_0px_black] transition-all group-hover:-translate-y-1"
                                        ></div>
                                        <span className="text-4xl mt-4">👎</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </section>

                    {/* TOP LISTS */}
                    {/* Helper function to render Top 3 list */}
                    {[
                        {title: "Top 3: Más Vistos", items: data.top3_most_viewed_messages, color: "bg-blue-200"},
                        {
                            title: "Top 3: Más Comentados",
                            items: data.top3_most_replied_messages,
                            color: "bg-yellow-200"
                        },
                        {
                            title: "Top 3: Más Negativos 🤬",
                            items: data.top3_most_negative_reaction_messages,
                            color: "bg-red-200"
                        },
                        {
                            title: "Top 3: Más Positivos 😍",
                            items: data.top3_most_positive_reaction_messages,
                            color: "bg-green-200"
                        },
                    ].map((section, idx) => (
                        <section key={idx} className="space-y-6">
                            <h2 className={`text-2xl md:text-4xl font-black inline-block px-4 py-1 neobrutal-border ${section.color} neobrutal-shadow`}>
                                {section.title}
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {section.items.map((msg, i) => (
                                    <div key={msg.id}
                                         className="transform hover:-translate-y-2 transition-transform duration-300">
                                        <div className="text-center font-bold text-4xl mb-2 opacity-20">#{i + 1}</div>
                                        <TelegramMessage
                                            message={msg}
                                            highlightCount={formatNumber(msg.count || 0)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    {/* WORD CLOUD */}
                    <section>
                        <h2 className="text-4xl font-black text-center mb-8">Palabras más repetidas</h2>
                        <WordCloud words={data.top25_most_repeated_words} color={theme.accent}/>
                    </section>

                    {/* SEN ANALYSIS */}
                    <section className="bg-white neobrutal-border p-4 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-red-500"></div>
                        <h2 className="text-4xl font-black text-center mb-12 text-red-600 uppercase tracking-widest">
                            Estado del SEN
                        </h2>
                        <SenAnalysisSection analysis={data.sen_analysis}/>
                    </section>

                    {/* BLOCKS ANALYSIS */}
                    <section>
                        <h2 className="text-4xl font-black text-center mb-12">Análisis de Bloques</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {data.blocks_analysis.map((block) => (
                                <BlockCard key={block.number} block={block} color={theme.accent}/>
                            ))}
                        </div>
                    </section>

                </main>
            )}

            {/* Footer */}
            <footer className="bg-black text-white p-8 mt-24 text-center border-t-4 border-gray-800">
                <p className="font-bold mb-4">UNE Unwrapped La Habana {selectedYear}</p>
                <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-8">
                    Esta página no está afiliada a la Empresa Eléctrica de La Habana ni a la Unión Eléctrica.
                    Los datos son una aproximación basada en mensajes públicos de Telegram y pueden contener errores de
                    interpretación algorítmica. NO deben ser tratados como datos oficiales y reales, pues pueden
                    contener errores
                    y estar alejados de la estimación real. Solo es para entretenimiento, usar con precaución.
                </p>
                <div className="flex justify-center items-center gap-4">
                    <a href="https://t.me/EmpresaElectricaDeLaHabana" target="_blank" rel="noreferrer"
                       className="bg-white text-black px-4 py-2 font-bold rounded hover:bg-gray-200">
                        Canal Oficial
                    </a>
                    {/* Hidden Feature */}
                    <a href="https://eduardoprofe666.github.io"
                       className="opacity-30 hover:opacity-100 transition-opacity text-2xl" title="???">
                        🎩
                    </a>
                </div>
            </footer>
            <Analytics/>
            <SpeedInsights/>
        </div>
    );
}

export default App;