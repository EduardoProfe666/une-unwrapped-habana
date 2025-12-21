import React, {lazy, Suspense, useEffect, useMemo, useState} from 'react';
import {domAnimation, LazyMotion, m, Variants} from 'framer-motion';
import {AVAILABLE_YEARS, YEAR_THEMES} from './common/constants.ts';
import {MessageSquare, ThumbsUp, TrendingUp} from 'lucide-react';
import SectionLoader from "@/src/components/SectionLoader.tsx";
import useYearAnalysis from "@/src/hooks/use-year-analysis.ts";
import AppFooter from "@/src/components/AppFooter.tsx";

const ReactionSpectrum = lazy(() => import("@/src/components/ReactionSpectrum.tsx"));
const TopList = lazy(() => import("@/src/components/TopList.tsx"));
const TotalsGrid = lazy(() => import("@/src/components/TotalsGrid.tsx"));
const AveragesCard = lazy(() => import("@/src/components/AveragesCard.tsx"));
const ExtremeMessages = lazy(() => import("@/src/components/ExtremeMessages.tsx"));
const FirstLastMessages = lazy(() => import("@/src/components/FirstLastMessages.tsx"));
const ChartSection = lazy(() => import('@/src/components/ChartSection.tsx'));
const WordCloud = lazy(() => import('@/src/components/WordCloud.tsx'));
const SenAnalysisSection = lazy(() => import('@/src/components/SenAnalysis.tsx'));
const BlockCard = lazy(() => import('@/src/components/BlockCard.tsx'));
const DistributionSection = lazy(() => import('@/src/components/DistributionSection'));
const DailyActivity = lazy(() => import('@/src/components/DailyActivity.tsx'));

function App() {
    const [selectedYear, setSelectedYear] = useState<number>(2025);
    const {data, loading} = useYearAnalysis(selectedYear);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const theme = useMemo(
        () => YEAR_THEMES[selectedYear] ?? YEAR_THEMES[2025],
        [selectedYear]
    );

    const fastContainerVariants = useMemo<Variants>(() => ({
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.05
            }
        }
    }), []);

    const fastItemVariants = useMemo<Variants>(() => ({
        hidden: {
            opacity: 0,
            y: 20
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.22,
                ease: 'easeOut'
            }
        }
    }), []);

    const totals = useMemo(() => data && [
        {
            label: 'Vistas Totales',
            value: data.total_views,
            icon: TrendingUp,
            colorClass: 'bg-blue-400'
        },
        {
            label: 'Mensajes',
            value: data.total_messages,
            icon: MessageSquare,
            colorClass: 'bg-yellow-400'
        },
        {
            label: 'Reacciones',
            value: data.total_reactions,
            icon: ThumbsUp,
            colorClass: 'bg-green-400'
        },
        {
            label: 'Comentarios',
            value: data.total_replies,
            icon: MessageSquare,
            colorClass: 'bg-red-400'
        },
    ], [data]);

    const topLists = useMemo(
        () => data && [
            {
                title: 'Top 3: Más Vistos 👀',
                items: data.top3_most_viewed_messages,
                badgeColorClass: 'bg-blue-200'
            },
            {
                title: 'Top 3: Más Comentados 📝',
                items: data.top3_most_replied_messages,
                badgeColorClass: 'bg-yellow-200'
            },
            {
                title: 'Top 3: Más Positivos 😍',
                items: data.top3_most_positive_reaction_messages,
                badgeColorClass: 'bg-green-200'
            },
            {
                title: 'Top 3: Más Negativos 🤬',
                items: data.top3_most_negative_reaction_messages,
                badgeColorClass: 'bg-red-200'
            }
        ],
        [data]
    );

    const scrollToFooter = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!data) return <div
        className="min-h-screen flex items-center justify-center font-bold text-2xl">CARGANDO...</div>;

    return (
        <LazyMotion features={domAnimation}>
            <div className={`min-h-screen ${theme.bg} text-black transition-colors duration-500 relative`}>

                {/* Sync Date Corner */}
                <div className="fixed top-0 right-0 p-2 z-50 hover:opacity-70 opacity-45 bg-black text-white text-[10px] font-mono border-l-2 border-b-2 border-white/20">
                    SYNC_OK: {new Date(data.sync_date).toLocaleString('es-CU')}
                </div>

                {/* Scroll to Top */}
                <m.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                        opacity: showScrollTop ? 1 : 0,
                        x: showScrollTop ? 0 : 20,
                        pointerEvents: showScrollTop ? 'auto' : 'none'
                    }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`fixed bottom-8 right-8 z-[100] p-4 ${theme.primary} border-4 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group`}
                >
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-2xl font-black">↑</span>
                        <span className="text-[10px] font-black">TOP</span>
                    </div>
                </m.button>

                {/* Hero Section */}
                <header className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden border-b-4 border-black bg-white">
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                         style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
                    <div className="absolute top-8 left-8 flex items-center gap-4 group">
                        <div className="relative">
                            <img src="/logo.webp" alt="Logo" width="360" height="360"
                                 className="h-14 w-14 p-1 bg-white border-4 border-black shadow-[4px_4px_0px_0px_black] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all"/>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-2xl leading-none tracking-tighter italic">UNE_UNWRAPPED</span>
                            <span className="text-[10px] font-bold bg-black text-white px-1 w-fit mt-1">HABANA_HUB</span>
                        </div>
                    </div>

                    <m.div
                        initial={{scale: 0.8, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        transition={{duration: 0.4}}
                        className="text-center z-10"
                    >
                        <h1 className="text-6xl md:text-9xl font-black mb-4 tracking-tighter">
                            {selectedYear}
                        </h1>
                        <p className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-8">
                            Resumen Eléctrico de La Habana
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center">
                            {AVAILABLE_YEARS.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-6 py-3 font-bold border-4 border-black text-lg transition-all shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:shadow-none ${
                                        selectedYear === year ? `${theme.primary} text-white` : 'bg-white'
                                    }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </m.div>

                    {/* Hero Decor */}
                    <div
                        className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full ${theme.secondary} opacity-50 blur-3xl`}></div>
                    <div
                        className={`absolute top-20 right-20 w-40 h-40 rounded-full ${theme.primary} opacity-30 blur-2xl`}></div>
                </header>

                {/* Disclaimer Section */}
                <section className="bg-yellow-300 border-b-4 border-black p-2 top-0 z-[40]">
                    <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 text-center">
                        <span className="text-sm font-black uppercase tracking-tight">
                            Proyecto independiente. Datos no oficiales basados en análisis de Telegram. Puede contener errores
                        </span>

                        <button
                            onClick={scrollToFooter}
                            className="group flex items-center gap-2 text-[11px] font-black uppercase bg-white border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                        >
                            Leer aviso legal completo
                            <span className="group-hover:translate-y-0.5 transition-transform font-bold">↓</span>
                        </button>
                    </div>
                </section>

                {loading ? (
                    <div className="h-screen flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <div className="text-6xl animate-bounce">⚡</div>
                            <p className="text-2xl font-black italic uppercase tracking-tighter">
                                Cargando datos del {selectedYear}...
                            </p>
                        </div>
                    </div>
                ) : (
                    <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-16">

                        {/* TOTALS GRID */}
                        <Suspense fallback={<SectionLoader/>}>
                            <TotalsGrid
                                items={totals}
                                containerVariants={fastContainerVariants}
                                itemVariants={fastItemVariants}
                            />
                        </Suspense>

                        {/* AVERAGES */}
                        <Suspense fallback={<SectionLoader/>}>
                            <AveragesCard
                                accentClass={theme.accent}
                                avgViews={data.avg_views}
                                avgReactions={data.avg_reactions}
                                avgTextLength={data.avg_text_length}
                                avgPositive={data.avg_positive_reactions}
                                avgNegative={data.avg_negative_reactions}
                                year={selectedYear}
                            />
                        </Suspense>

                        {/* MONTHLY CHARTS */}
                        <section>
                            <h2 className="text-4xl font-black mb-8 text-center bg-black text-white inline-block px-4 py-2 transform -rotate-2">
                                Tendencias Mensuales
                            </h2>
                            <Suspense fallback={<SectionLoader/>}>
                                <ChartSection data={data} color={theme.accent}/>
                            </Suspense>
                        </section>

                        {/* BLOCKS ANALYSIS */}
                        <section className="mt-20">
                            <div className="flex flex-col items-center mb-16 relative">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-black/10 -z-10"/>

                                <div
                                    className="bg-white border-4 border-black px-8 py-3 shadow-[8px_8px_0px_0px_black] relative">
                                    <span className="absolute -top-3 left-4 bg-black text-white text-[10px] font-black px-2 py-0.5 tracking-widest uppercase">
                                        System_Module: Bk
                                    </span>
                                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                                        Análisis de Bloques
                                    </h2>
                                </div>
                            </div>

                            <Suspense fallback={<SectionLoader/>}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {data.blocks_analysis.map((block) => (
                                        <BlockCard key={block.number} block={block} color={theme.accent}
                                                   year={selectedYear}/>
                                    ))}
                                </div>
                            </Suspense>
                        </section>

                        {/* DAILY ACTIVITY */}
                        <Suspense fallback={<SectionLoader/>}>
                            <DailyActivity
                                dailyMessages={data.daily_messages}
                                colorClass={theme.primary}
                                year={selectedYear}
                            />
                        </Suspense>

                        {/* DISTRIBUTION */}
                        <Suspense fallback={<SectionLoader/>}>
                            <DistributionSection
                                distributionMessage={data.distribution_message}
                                totalMessages={data.total_messages}
                                totalReactions={data.total_reactions}
                                totalPositiveReactions={data.total_positive_reactions}
                                totalNegativeReactions={data.total_negative_reactions}
                                primaryColorClass={theme.primary}
                            />
                        </Suspense>

                        {/*  REACTION SPECTRUM */}
                        <Suspense fallback={<SectionLoader/>}>
                            <ReactionSpectrum
                                distributionReaction={data.distribution_reaction}
                                totalReactions={data.total_reactions}
                                accentColor={theme.primary}
                                year={selectedYear}
                            />
                        </Suspense>

                        {/* WORD CLOUD */}
                        <section>
                            <Suspense fallback={<SectionLoader/>}>
                                <WordCloud words={data.top25_most_repeated_words} color={theme.accent}/>
                            </Suspense>
                        </section>

                        {/* SEN ANALYSIS */}
                        <section className="bg-white neobrutal-border p-4 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                            <div className="absolute bottom-0 left-0 w-full h-2 bg-red-500"></div>
                            <h2 className="text-4xl font-black text-center mb-12 text-red-600 uppercase tracking-widest">
                                Estado del SEN
                            </h2>
                            <Suspense fallback={<SectionLoader/>}>
                                <SenAnalysisSection analysis={data.sen_analysis}/>
                            </Suspense>
                        </section>

                        {/* Text Stats */}
                        <Suspense fallback={<SectionLoader/>}>
                            <FirstLastMessages
                                firstMessage={data.first_message}
                                lastMessage={data.last_message}
                            />
                        </Suspense>

                        {/* EXTREMES (Shortest/Longest) */}
                        <Suspense fallback={<SectionLoader/>}>
                            <ExtremeMessages
                                shortestMessage={data.shortest_message}
                                longestMessage={data.longest_message}
                            />
                        </Suspense>

                        {/* TOP LISTS */}
                        <section className="space-y-16">
                            <Suspense fallback={<SectionLoader/>}>
                                {topLists.map(section => (
                                    <TopList
                                        key={section.title}
                                        title={section.title}
                                        items={section.items}
                                        badgeColorClass={section.badgeColorClass}
                                    />
                                ))}
                            </Suspense>
                        </section>

                    </main>
                )}

                {/* Footer */}
                <AppFooter
                    year={selectedYear}
                    color={theme.primary}
                />
            </div>
        </LazyMotion>
    );
}

export default App;