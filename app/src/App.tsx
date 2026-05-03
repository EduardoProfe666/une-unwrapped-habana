import React, {lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, domAnimation, LazyMotion, m, Variants} from 'framer-motion';
import {AVAILABLE_YEARS, YEAR_THEMES} from '@/src/lib/constants.ts';
import {MessageSquare, ThumbsUp, TrendingUp} from 'lucide-react';
import SectionLoader from "@/src/components/SectionLoader.tsx";
import useYearAnalysis, {prefetchYearAnalysis} from "@/src/hooks/use-year-analysis.ts";
import useSeo from "@/src/hooks/use-seo.ts";
import AppFooter from "@/src/components/AppFooter.tsx";
import SectionHeader from "@/src/components/SectionHeader.tsx";
import {rafThrottle} from "@/src/lib/utils.ts";

// Module-level constants — avoid re-creating these style objects on every render
const HERO_DOT_PATTERN: React.CSSProperties = {
    backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
    backgroundSize: '30px 30px',
};
const BLACKOUT_HALO: React.CSSProperties = {
    background: 'radial-gradient(circle at 100px 100px, rgba(255,255,255,0.15) 0%, transparent 60%)',
};

const NavigationHub = lazy(() => import('@/src/components/NavigationHub.tsx'));
const SyncStatus = lazy(() => import('@/src/components/SyncStatus.tsx'));
const PwaUpdatePrompt = lazy(() => import('@/src/components/PwaUpdatePrompt.tsx'));
const HistoricalUnwrapped = lazy(() => import('@/src/components/HistoricalUnwrapped.tsx'));
const WeeklyBlockMatrix = lazy(() => import('@/src/components/WeeklyBlockMatrix.tsx'));
const GithubSupport = lazy(() => import("@/src/components/GithubSupport.tsx"));
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

// AI ENRICHMENT sections
const SeverityCalendar = lazy(() => import('@/src/components/SeverityCalendar.tsx'));
const AffectedZonesMap = lazy(() => import('@/src/components/AffectedZonesMap.tsx'));
const PowerTimelineChart = lazy(() => import('@/src/components/PowerTimelineChart.tsx'));
const ThermalPlantsRanking = lazy(() => import('@/src/components/ThermalPlantsRanking.tsx'));
const HourOfDayClock = lazy(() => import('@/src/components/HourOfDayClock.tsx'));
const WorstDayHero = lazy(() => import('@/src/components/WorstDayHero.tsx'));
const GridStatusBanner = lazy(() => import('@/src/components/GridStatusBanner.tsx'));
const BlockExplorer = lazy(() => import('@/src/components/BlockExplorer.tsx'));

// WRAPPED / records sections
const HallOfFame = lazy(() => import('@/src/components/HallOfFame.tsx'));
const DaysWithoutBlackout = lazy(() => import('@/src/components/DaysWithoutBlackout.tsx'));
const HealthScore = lazy(() => import('@/src/components/HealthScore.tsx'));
const CalmestDayHero = lazy(() => import('@/src/components/CalmestDayHero.tsx'));
const WeeklyHeatmap = lazy(() => import('@/src/components/WeeklyHeatmap.tsx'));
const SentimentTimeline = lazy(() => import('@/src/components/SentimentTimeline.tsx'));
const TopQuotes = lazy(() => import('@/src/components/TopQuotes.tsx'));
const BlocksRadar = lazy(() => import('@/src/components/BlocksRadar.tsx'));
const CategoryStreamgraph = lazy(() => import('@/src/components/CategoryStreamgraph.tsx'));
const BlackoutPredictor = lazy(() => import('@/src/components/BlackoutPredictor.tsx'));
const LiveTicker = lazy(() => import('@/src/components/LiveTicker.tsx'));
const YearWrapped = lazy(() => import('@/src/components/YearWrapped.tsx'));

function App() {
    const [selectedYear, setSelectedYear] = useState<number>(2025);
    const {data, loading} = useYearAnalysis(selectedYear);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Update <title>, description meta family, and inject year-specific
    // Dataset JSON-LD so social cards + search snippets reflect the active year
    useSeo(selectedYear, data);

    const theme = useMemo(
        () => YEAR_THEMES[selectedYear] ?? YEAR_THEMES[2025],
        [selectedYear]
    );

    const [powerState, setPowerState] = useState<'ON' | 'OVERLOAD' | 'OFF'>('ON');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
        // Lazy-init the audio element only on first play. preload="none" so the
        // ~50KB mp3 isn't downloaded for users who never trigger the easter egg.
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (powerState === 'OFF') {
            if (!audioRef.current) {
                audioRef.current = new Audio('/audio/choco.mp3');
                audioRef.current.volume = 0.8;
                audioRef.current.preload = 'none';
            }
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        } else if (powerState === 'ON' && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [powerState]);

    const triggerBlackout = useCallback(() => {
        setPowerState(prev => {
            if (prev === 'OFF') return 'ON';
            if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200, 100, 200, 100, 300, 100, 600]);
            window.setTimeout(() => setPowerState('OFF'), 2000);
            return 'OVERLOAD';
        });
    }, []);

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

    const scrollToFooter = useCallback(() => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    }, []);

    const scrollToTop = useCallback(() => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, []);

    // RAF-throttled — coalesces scroll bursts into one update per frame.
    // Also avoids redundant setState calls when the threshold doesn't change.
    useEffect(() => {
        let visible = false;
        const update = rafThrottle(() => {
            const next = window.scrollY > 400;
            if (next !== visible) {
                visible = next;
                setShowScrollTop(next);
            }
        });
        window.addEventListener('scroll', update, {passive: true});
        return () => window.removeEventListener('scroll', update);
    }, []);

    if (!data) return <div
        className="min-h-screen flex items-center justify-center font-black text-2xl text-black bg-[#fdf6e3] uppercase tracking-tighter italic">CARGANDO...</div>;

    return (
        <LazyMotion features={domAnimation}>
            <div className={`min-h-screen ${theme.bg} text-black transition-colors duration-500 relative`}>

                {/* Sync status corner — live countdown to next hourly sync */}
                <Suspense fallback={null}>
                    <SyncStatus syncDate={data.sync_date}/>
                </Suspense>

                {/* Blackout Failure Easter Egg */}
                <AnimatePresence>
                    {powerState === 'OVERLOAD' && (
                        <m.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[90] bg-red-500/20 pointer-events-none mix-blend-hard-light"
                        >
                            <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_12px)] opacity-20 animate-[pulse_0.2s_infinite]" />
                        </m.div>
                    )}

                    {powerState === 'OFF' && (
                        <>
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 2 } }}
                                transition={{ duration: 0.1 }}
                                className="fixed inset-0 z-[80] bg-black cursor-pointer"
                                onClick={() => triggerBlackout()}
                            >
                                <div className="absolute bottom-10 left-10 font-mono text-xs text-gray-600 opacity-50">
                                    <p>{'>'} COLAPSO_SEN_NO.666</p>
                                    <p>{'>'} DISPARO_DAF</p>
                                    <p>{'>'} TRABAJANDO_EN_BASE_A_ELLO... [FALLO]</p>
                                    <p className="mt-4 text-white/30 animate-pulse">Toca en cualquier parte para arrancar la patana</p>
                                </div>

                                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            </m.div>

                            <m.div
                                className="fixed top-0 left-0 w-[400px] h-[400px] pointer-events-none z-[90]"
                                animate={{ opacity: [0.2, 0.4, 0.1, 0.3] }}
                                transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
                                style={BLACKOUT_HALO}
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* Scroll to Top */}
                <m.button
                    initial={{opacity: 0, x: 20}}
                    animate={{
                        opacity: showScrollTop ? 1 : 0,
                        x: showScrollTop ? 0 : 20,
                        pointerEvents: showScrollTop ? 'auto' : 'none'
                    }}
                    onClick={scrollToTop}
                    className={`fixed cursor-pointer bottom-8 right-8 z-[100] p-4 ${theme.primary} border-4 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group`}
                >
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-2xl font-black">↑</span>
                        <span className="text-[10px] font-black">TOP</span>
                    </div>
                </m.button>

                {/* Hero Section */}
                <header
                    className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden border-b-4 border-black bg-white">
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={HERO_DOT_PATTERN}/>
                    <div className="absolute top-8 left-8 flex items-center gap-4 group z-[95]">
                        <m.button
                            onClick={triggerBlackout}
                            animate={powerState === 'OVERLOAD' ? {
                                x: [0, -5, 5, -5, 5, 0],
                                rotate: [0, -5, 5, -10, 10, 0],
                                scale: [1, 1.1, 0.9, 1.2, 1],
                                transition: { duration: 0.3, repeat: Infinity }
                            } : {}}
                            className="relative cursor-pointer"
                        >
                            <div className="relative item">
                                <m.img
                                    src="/images/logo.webp"
                                    alt="Logo"
                                    width="360"
                                    height="360"
                                    className={`h-14 w-14 p-1 border-4 transition-all duration-300 relative z-20
                                    ${powerState === 'ON' ? 'bg-white border-black shadow-[4px_4px_0px_0px_black] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1' : ''}
                                    ${powerState === 'OVERLOAD' ? 'bg-red-500 border-black invert sepia' : ''}
                                    ${powerState === 'OFF' ? 'bg-black border-white/50 grayscale opacity-80' : ''}
                                    `}
                                    animate={powerState === 'OFF' ? {
                                        opacity: [0.4, 1, 0.5, 0.8, 0.2, 1],
                                        filter: [
                                            'drop-shadow(0 0 0px rgba(255,255,255,0))',
                                            'drop-shadow(0 0 15px rgba(255,255,255,0.6))',
                                            'drop-shadow(0 0 5px rgba(255,255,255,0.2))'
                                        ]
                                    } : {}}
                                    transition={powerState === 'OFF' ? {
                                        duration: 3,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        ease: "easeInOut",
                                        times: [0, 0.1, 0.2, 0.4, 0.8, 1]
                                    } : {}}
                                />

                                {powerState === 'OVERLOAD' && (
                                    <m.div
                                        initial={{ scale: 1 }} animate={{ scale: 2, opacity: 0 }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                        className="absolute inset-0 bg-yellow-400 -z-10 rounded-full"
                                    />
                                )}
                            </div>
                        </m.button>

                        <div className="flex flex-col">
                            <span className={`font-black text-2xl leading-none tracking-tighter italic transition-all duration-300
                                ${powerState === 'ON' ? 'text-black' : ''}
                                ${powerState === 'OVERLOAD' ? 'text-red-600 animate-pulse scale-110' : ''}
                                ${powerState === 'OFF' ? 'text-white/20 blur-[1px]' : ''}
                            `}>
                                {powerState === 'ON' && "UNE_UNWRAPPED"}
                                {powerState === 'OVERLOAD' && "ERROR_CRÍTICO"}
                                {powerState === 'OFF' && "APAGÓN"}
                            </span>

                            <span className={`text-[10px] font-bold px-1 w-fit mt-1 transition-all
                                ${powerState === 'ON' ? 'bg-black text-white' : ''}
                                ${powerState === 'OVERLOAD' ? 'bg-red-600 text-yellow-300 animate-bounce' : ''}
                                ${powerState === 'OFF' ? 'bg-transparent text-white/10 border border-white/10' : ''}
                            `}>
                                {powerState === 'ON' && "HABANA_HUB"}
                                {powerState === 'OVERLOAD' && "BAJÓN_VOLTAJE"}
                                {powerState === 'OFF' && "OFFLINE"}
                            </span>
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
                                <div key={year} className="relative group">
                                    <button
                                        onClick={() => setSelectedYear(year)}
                                        onMouseEnter={() => prefetchYearAnalysis(year)}
                                        onFocus={() => prefetchYearAnalysis(year)}
                                        className={`px-6 py-3 font-bold cursor-pointer border-4 border-black text-lg shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:shadow-none relative overflow-visible ${
                                            selectedYear === year ? `${theme.primary} text-white` : 'bg-white'
                                        }`}
                                    >
                                        {year}

                                        {year === 2026 && (
                                            <m.div
                                                className="absolute -top-4 -right-6 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_black] z-30 pointer-events-none"
                                                initial={{ rotate: 15 }}
                                                animate={{
                                                    scale: [1, 1.05, 1]
                                                }}
                                                whileHover={{
                                                    scale: 1.2,
                                                    rotate: -5,
                                                    backgroundColor: "#000",
                                                    transition: { type: "spring", stiffness: 400 }
                                                }}
                                                transition={{
                                                    scale: { repeat: Infinity, duration: 2 }
                                                }}
                                            >
                                    <span className="flex items-center gap-1">
                                        <span className="animate-pulse">●</span> PREVIEW
                                    </span>
                                            </m.div>
                                        )}
                                    </button>

                                    {year === 2026 && (
                                        <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-max opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-black text-white text-[10px] font-mono px-3 py-1 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[110]">
                                            <span className="text-yellow-400">ADVERTENCIA:</span> DATOS_INCOMPLETOS
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Cross-year aggregate — opens a modal with all-time records, sibling
                            of the year selector (it's effectively "ALL years" at once) */}
                        <div className="mt-6 md:mt-8 flex justify-center">
                            <Suspense fallback={null}>
                                <HistoricalUnwrapped/>
                            </Suspense>
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
                            className="group flex cursor-pointer items-center gap-2 text-[11px] font-black uppercase bg-white border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                        >
                            Leer aviso legal completo
                            <span className="group-hover:translate-y-0.5 transition-transform font-bold">↓</span>
                        </button>
                    </div>
                </section>

                {/* Live SEN status banner (AI-derived) */}
                <Suspense fallback={null}>
                    <GridStatusBanner status={data.live_grid_status} year={selectedYear}/>
                </Suspense>

                {/* Live ticker bar */}
                <Suspense fallback={null}>
                    <LiveTicker data={data} primaryColorClass={theme.primary}/>
                </Suspense>

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
                        {/* 01 — WRAPPED FIRST (Spotify-style hook: STORY MODE button on top) */}
                        <SectionHeader id="wrapped-group" title="01_WRAPPED" color="bg-violet-400"/>
                        <div className="space-y-12">
                            <div id="year-wrapped">
                                <Suspense fallback={<SectionLoader/>}>
                                    <YearWrapped data={data} primaryColorClass={theme.primary} secondaryColorClass={theme.secondary}/>
                                </Suspense>
                            </div>
                            {data.health_score != null && (
                                <div id="health-score">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <HealthScore score={data.health_score} breakdown={data.health_breakdown}/>
                                    </Suspense>
                                </div>
                            )}
                            <div id="hall-of-fame">
                                <Suspense fallback={<SectionLoader/>}>
                                    <HallOfFame data={data} primaryColorClass={theme.primary}/>
                                </Suspense>
                            </div>
                            {data.year_records && (
                                <div id="days-counter">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <DaysWithoutBlackout records={data.year_records}/>
                                    </Suspense>
                                </div>
                            )}
                            {data.blackout_probability_now != null && (
                                <div id="predictor">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <BlackoutPredictor probability={data.blackout_probability_now}/>
                                    </Suspense>
                                </div>
                            )}
                        </div>

                        {/* 02 — MÉTRICAS BASE (foundational numbers) */}
                        <SectionHeader id="metrics-group" title="02_MÉTRICAS_BASE" color="bg-blue-400"/>
                        <div className="space-y-12">
                            <div id="totals-grid">
                                <Suspense fallback={<SectionLoader/>}>
                                    <TotalsGrid
                                        items={totals}
                                        containerVariants={fastContainerVariants}
                                        itemVariants={fastItemVariants}
                                    />
                                </Suspense>
                            </div>

                            <div id="averages">
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
                            </div>

                            <div id="daily-activity">
                                <Suspense fallback={<SectionLoader/>}>
                                    <DailyActivity
                                        dailyMessages={data.daily_messages}
                                        colorClass={theme.primary}
                                        year={selectedYear}
                                    />
                                </Suspense>
                            </div>
                        </div>

                        {/* 03 — HITOS DEL AÑO (severity calendar sets the scene → worst → calmest) */}
                        {((data.daily_severity && Object.keys(data.daily_severity).length > 0) || data.worst_day || data.calmest_day) && (
                            <>
                                <SectionHeader id="story-group" title="03_HITOS_DEL_AÑO" color="bg-fuchsia-400"/>
                                <div className="space-y-12">
                                    {/* SEVERITY CALENDAR — yearly heatmap that contextualizes the heroes below */}
                                    {data.daily_severity && Object.keys(data.daily_severity).length > 0 && (
                                        <div id="severity-calendar">
                                            <Suspense fallback={<SectionLoader/>}>
                                                <SeverityCalendar
                                                    dailySeverity={data.daily_severity}
                                                    year={selectedYear}
                                                    accentClass={theme.accent}
                                                />
                                            </Suspense>
                                        </div>
                                    )}
                                    {data.worst_day && (
                                        <div id="worst-day">
                                            <Suspense fallback={<SectionLoader/>}>
                                                <WorstDayHero worstDay={data.worst_day}/>
                                            </Suspense>
                                        </div>
                                    )}
                                    {data.calmest_day && (
                                        <div id="calmest-day">
                                            <Suspense fallback={<SectionLoader/>}>
                                                <CalmestDayHero calmestDay={data.calmest_day}/>
                                            </Suspense>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* BLOCKS ANALYSIS */}
                        <SectionHeader id="infra-group" title="04_INFRAESTRUCTURA" color="bg-yellow-400"/>
                        <div className="space-y-16">
                            <div id="blocks-analysis">
                                <section className="mt-20">
                                    <div className="flex flex-col items-center mb-16 relative">
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-black/10 -z-10"/>

                                        <div
                                            className="bg-white border-4 border-black px-8 py-3 shadow-[8px_8px_0px_0px_black] relative">
                                    <span
                                        className="absolute -top-3 left-4 bg-black text-white text-[10px] font-black px-2 py-0.5 tracking-widest uppercase">
                                        System_Module: Bk
                                    </span>
                                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                                                Resumen de Bloques
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
                            </div>

                            {/* BLOCK EXPLORER (AI) */}
                            {data.blocks_analysis && data.blocks_analysis.length > 0 && (
                                <div id="block-explorer">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <BlockExplorer
                                            blocks={data.blocks_analysis}
                                            primaryColorClass={theme.primary}
                                            secondaryColorClass={theme.secondary}
                                        />
                                    </Suspense>
                                </div>
                            )}

                            {/* BLOCKS RADAR */}
                            {data.blocks_analysis && data.blocks_analysis.length > 0 && (
                                <div id="blocks-radar">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <BlocksRadar blocks={data.blocks_analysis} primaryColorClass={theme.primary}/>
                                    </Suspense>
                                </div>
                            )}

                            {/* Weekly Block Matrix */}
                            <div id="weekly-block-matrix">
                                <section className="mt-20">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <WeeklyBlockMatrix blocks={data.blocks_analysis} year={selectedYear}/>
                                    </Suspense>
                                </section>
                            </div>

                            {/* SEN ANALYSIS */}
                            <div id="sen-status">
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
                            </div>

                            {/* THERMAL PLANTS RANKING (AI) */}
                            {data.thermal_units && data.thermal_units.length > 0 && (
                                <div id="thermal-units">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <ThermalPlantsRanking
                                            units={data.thermal_units}
                                            primaryColorClass={theme.primary}
                                        />
                                    </Suspense>
                                </div>
                            )}
                        </div>

                        {/* GEOGRAFÍA + RITMO */}
                        {((data.affected_zones && data.affected_zones.length > 0) ||
                          (data.hour_of_day_severity && Object.keys(data.hour_of_day_severity).length > 0)) && (
                            <>
                                <SectionHeader id="geo-group" title="05_GEOGRAFÍA_Y_RITMO" color="bg-cyan-400"/>
                                <div className="space-y-16">
                                    {data.affected_zones && data.affected_zones.length > 0 && (
                                        <div id="affected-zones">
                                            <Suspense fallback={<SectionLoader/>}>
                                                <AffectedZonesMap
                                                    zones={data.affected_zones}
                                                    primaryColorClass={theme.primary}
                                                />
                                            </Suspense>
                                        </div>
                                    )}

                                    {data.hour_of_day_severity && Object.keys(data.hour_of_day_severity).length > 0 && (
                                        <div id="hour-clock">
                                            <Suspense fallback={<SectionLoader/>}>
                                                <HourOfDayClock
                                                    hourOfDaySeverity={data.hour_of_day_severity}
                                                    primaryColorClass={theme.primary}
                                                />
                                            </Suspense>
                                        </div>
                                    )}

                                    {data.weekly_hourly_severity && Object.keys(data.weekly_hourly_severity).length > 0 && (
                                        <div id="weekly-heatmap">
                                            <Suspense fallback={<SectionLoader/>}>
                                                <WeeklyHeatmap
                                                    weeklyHourlySeverity={data.weekly_hourly_severity}
                                                    primaryColorClass={theme.primary}
                                                />
                                            </Suspense>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <SectionHeader id="analysis-group" title="06_ANÁLISIS_TEMPORAL" color="bg-green-400"/>
                        <div className="space-y-16">
                            {/* MONTHLY CHARTS */}
                            <div id="monthly-charts">
                                <section>
                                    <h2 className="text-4xl font-black mb-8 text-center bg-black text-white inline-block px-4 py-2 transform -rotate-2">
                                        Tendencias Mensuales
                                    </h2>
                                    <Suspense fallback={<SectionLoader/>}>
                                        <ChartSection data={data} color={theme.accent}/>
                                    </Suspense>
                                </section>
                            </div>

                            {/* POWER TIMELINE (AI) — power numbers over time */}
                            {data.power_timeline && data.power_timeline.length > 0 && (
                                <div id="power-timeline">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <PowerTimelineChart
                                            powerTimeline={data.power_timeline}
                                            primaryColorClass={theme.primary}
                                        />
                                    </Suspense>
                                </div>
                            )}

                            {/* CATEGORY STREAMGRAPH — categories over time (continues the time-series flow) */}
                            {data.ai_categories_monthly && Object.keys(data.ai_categories_monthly).length > 0 && (
                                <div id="category-streamgraph">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <CategoryStreamgraph categoriesMonthly={data.ai_categories_monthly}/>
                                    </Suspense>
                                </div>
                            )}

                            {/* SENTIMENT TIMELINE — sentiment over time */}
                            {data.sentiment_monthly && Object.keys(data.sentiment_monthly).length > 0 && (
                                <div id="sentiment">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <SentimentTimeline sentimentMonthly={data.sentiment_monthly} primaryColorClass={theme.primary}/>
                                    </Suspense>
                                </div>
                            )}

                            {/* DISTRIBUTION — static category breakdown after the time-series block */}
                            <div id="distribution">
                                <Suspense fallback={<SectionLoader/>}>
                                    <DistributionSection
                                        distributionMessage={data.distribution_message}
                                        aiCategoriesDistribution={data.ai_categories_distribution}
                                        totalMessages={data.total_messages}
                                        totalReactions={data.total_reactions}
                                        totalPositiveReactions={data.total_positive_reactions}
                                        totalNegativeReactions={data.total_negative_reactions}
                                        primaryColorClass={theme.primary}
                                    />
                                </Suspense>
                            </div>

                            {/*  REACTION SPECTRUM */}
                            <div id="reaction-spectrum">
                                <Suspense fallback={<SectionLoader/>}>
                                    <ReactionSpectrum
                                        distributionReaction={data.distribution_reaction}
                                        totalReactions={data.total_reactions}
                                        accentColor={theme.primary}
                                        year={selectedYear}
                                    />
                                </Suspense>
                            </div>
                        </div>

                        <SectionHeader id="social-group" title="07_SOCIAL_Y_TEXTO" color="bg-red-400"/>
                        <div className="space-y-16">
                            {/* WORD CLOUD — visual hook of the year's vocabulary */}
                            <div id="word-cloud">
                                <section>
                                    <Suspense fallback={<SectionLoader/>}>
                                        <WordCloud words={data.top25_most_repeated_words} color={theme.accent}/>
                                    </Suspense>
                                </section>
                            </div>

                            {/* TOP QUOTES — punchiest text of the year, comes right after word cloud */}
                            {data.top_quotes && data.top_quotes.length > 0 && (
                                <div id="top-quotes">
                                    <Suspense fallback={<SectionLoader/>}>
                                        <TopQuotes quotes={data.top_quotes} primaryColorClass={theme.primary}/>
                                    </Suspense>
                                </div>
                            )}

                            {/* FIRST / LAST messages — chronological bookends */}
                            <div id="text-stats">
                                <Suspense fallback={<SectionLoader/>}>
                                    <FirstLastMessages
                                        firstMessage={data.first_message}
                                        lastMessage={data.last_message}
                                    />
                                </Suspense>
                            </div>

                            {/* EXTREMES (Shortest/Longest) */}
                            <div id="extremes">
                                <Suspense fallback={<SectionLoader/>}>
                                    <ExtremeMessages
                                        shortestMessage={data.shortest_message}
                                        longestMessage={data.longest_message}
                                    />
                                </Suspense>
                            </div>

                            {/* TOP LISTS — ranking finale */}
                            <div id="top-lists">
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
                            </div>
                        </div>

                        <Suspense fallback={<SectionLoader/>}>
                            <GithubSupport accentColor={theme.primary}/>
                        </Suspense>

                    </main>
                )}

                {/* Index Map */}
                <Suspense fallback={<SectionLoader/>}>
                    <NavigationHub/>
                </Suspense>

                {/* PWA update toast — appears when a new service worker is waiting */}
                <Suspense fallback={null}>
                    <PwaUpdatePrompt/>
                </Suspense>

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