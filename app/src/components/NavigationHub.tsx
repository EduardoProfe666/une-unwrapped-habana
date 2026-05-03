import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {
    Activity,
    Award,
    BarChart2,
    Bolt,
    Calendar,
    CalendarDays,
    Clock,
    Compass,
    Cpu,
    Factory,
    Film,
    Hash,
    HeartPulse,
    Hexagon,
    History,
    Layers,
    Leaf,
    Map,
    MapPinned,
    MessageSquare,
    MousePointer2,
    Quote,
    Search,
    Skull,
    Trophy,
    TrendingUp,
    Waves,
    X,
    Zap,
} from 'lucide-react';
import {rafThrottle} from '@/src/lib/utils.ts';

interface SectionLink {
    id: string;
    label: string;
    icon: React.ElementType;
}

interface SectionGroup {
    title: string;
    color: string;
    links: SectionLink[];
}

const SECTIONS: SectionGroup[] = [
    {
        title: "01_WRAPPED",
        color: "bg-violet-400",
        links: [
            {id: "year-wrapped", label: "Year Wrapped", icon: Film},
            {id: "historical-unwrapped", label: "Histórico Global", icon: History},
            {id: "health-score", label: "Health Score", icon: HeartPulse},
            {id: "hall-of-fame", label: "Hall of Fame", icon: Trophy},
            {id: "days-counter", label: "Contador del SEN", icon: Award},
            {id: "predictor", label: "Apagómetro", icon: Cpu},
        ]
    },
    {
        title: "02_MÉTRICAS_BASE",
        color: "bg-blue-400",
        links: [
            {id: "totals-grid", label: "Resumen General", icon: Hash},
            {id: "averages", label: "Medias por Mensaje", icon: TrendingUp},
            {id: "daily-activity", label: "Flujo de Mensajes", icon: BarChart2},
        ]
    },
    {
        title: "03_HITOS_DEL_AÑO",
        color: "bg-fuchsia-400",
        links: [
            {id: "severity-calendar", label: "Calendario de Severidad", icon: CalendarDays},
            {id: "worst-day", label: "El Peor Día", icon: Skull},
            {id: "calmest-day", label: "El Día más Calmo", icon: Leaf},
        ]
    },
    {
        title: "04_INFRAESTRUCTURA",
        color: "bg-yellow-400",
        links: [
            {id: "blocks-analysis", label: "Resumen por Bloque", icon: Layers},
            {id: "block-explorer", label: "Explorador de Bloques", icon: Compass},
            {id: "blocks-radar", label: "Radar de Bloques", icon: Hexagon},
            {id: "weekly-block-matrix", label: "Matriz Semanal", icon: Calendar},
            {id: "sen-status", label: "Estado del SEN", icon: Zap},
            {id: "thermal-units", label: "Centrales Termoeléctricas", icon: Factory},
        ]
    },
    {
        title: "05_GEOGRAFÍA_Y_RITMO",
        color: "bg-cyan-400",
        links: [
            {id: "affected-zones", label: "Mapa de Afectaciones", icon: MapPinned},
            {id: "hour-clock", label: "Ritmo del Año", icon: Activity},
            {id: "weekly-heatmap", label: "Mapa Día × Hora", icon: CalendarDays},
        ]
    },
    {
        title: "06_ANÁLISIS_TEMPORAL",
        color: "bg-green-400",
        links: [
            {id: "monthly-charts", label: "Evolución Mensual", icon: TrendingUp},
            {id: "power-timeline", label: "Demanda vs Disponibilidad", icon: Bolt},
            {id: "category-streamgraph", label: "Marea de Categorías", icon: Waves},
            {id: "sentiment", label: "Termómetro Frustración", icon: HeartPulse},
            {id: "distribution", label: "Tipos de Mensajes", icon: BarChart2},
            {id: "reaction-spectrum", label: "Espectro de Reacciones", icon: MousePointer2},
        ]
    },
    {
        title: "07_SOCIAL_Y_TEXTO",
        color: "bg-red-400",
        links: [
            {id: "word-cloud", label: "Nube de Conceptos", icon: MessageSquare},
            {id: "top-quotes", label: "Frases del Año", icon: Quote},
            {id: "text-stats", label: "Hitos Temporales", icon: Clock},
            {id: "extremes", label: "Longitud Crítica", icon: Search},
            {id: "top-lists", label: "Rankings de Impacto", icon: Award},
        ]
    }
];

// Flatten section IDs once at module-load. Used by the scroll observer
// instead of rebuilding the list on every scroll tick.
const ALL_SECTION_IDS: string[] = SECTIONS.flatMap(g => g.links.map(l => l.id));

const NavigationHub: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('');

    // IntersectionObserver is far cheaper than calling getBoundingClientRect on
    // ~30 elements per scroll tick. We mark a section "active" when it enters
    // the upper half of the viewport.
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') {
            // Fallback: throttled scroll observer
            let lastActive = '';
            const handle = rafThrottle(() => {
                const half = window.innerHeight / 2;
                for (const id of ALL_SECTION_IDS) {
                    const el = document.getElementById(id);
                    if (!el) continue;
                    const top = el.getBoundingClientRect().top;
                    if (top >= 0 && top <= half) {
                        if (id !== lastActive) {
                            lastActive = id;
                            setActiveSection(id);
                        }
                        return;
                    }
                }
            });
            window.addEventListener('scroll', handle, {passive: true});
            return () => window.removeEventListener('scroll', handle);
        }

        // Use IntersectionObserver for cheaper "is in upper half of viewport" checks
        const observer = new IntersectionObserver(
            (entries) => {
                // Find the topmost entry that's currently intersecting in the upper half
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .map(e => ({id: e.target.id, top: e.boundingClientRect.top}))
                    .sort((a, b) => Math.abs(a.top) - Math.abs(b.top));
                if (visible.length > 0) setActiveSection(visible[0].id);
            },
            {
                // Trigger when the section enters the top 50% of the viewport
                rootMargin: '0px 0px -50% 0px',
                threshold: 0,
            }
        );

        const elements = ALL_SECTION_IDS
            .map(id => document.getElementById(id))
            .filter((el): el is HTMLElement => el != null);
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const scrollTo = useCallback((id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({behavior: 'smooth'});
            setIsOpen(false);
        }
    }, []);

    const handleClose = useCallback(() => setIsOpen(false), []);
    const handleOpen = useCallback(() => setIsOpen(true), []);

    return (
        <>
            <m.button
                initial={{scale: 0}}
                animate={{scale: 1}}
                whileTap={{scale: 0.95}}
                onClick={handleOpen}
                className="fixed bottom-8 left-4 md:left-8 z-40 bg-white text-black border-4 border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_black] transition-all group hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <Map size={24} strokeWidth={2.5}/>
                    <span
                        className="font-black uppercase text-xs md:text-sm hidden md:block group-hover:underline decoration-2 underline-offset-2">
                        Mapa del Sitio
                    </span>
                </div>
                <div
                    className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 border-2 border-black rounded-full animate-pulse"/>
            </m.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <m.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            onClick={handleClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />

                        <m.div
                            initial={{x: '-100%', opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            exit={{x: '-100%', opacity: 0}}
                            transition={{type: "spring", damping: 25, stiffness: 200}}
                            className="fixed top-0 left-0 h-full w-full md:w-[480px] bg-white border-r-4 border-black z-[101] overflow-y-auto shadow-[20px_0px_0px_0px_rgba(0,0,0,0.2)]"
                        >
                            <div
                                className="sticky top-0 bg-black text-white p-6 flex justify-between items-center border-b-4 border-black z-10">
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                                        Navegación
                                    </h2>
                                    <p className="text-[10px] font-mono opacity-60">SYSTEM_DIRECTORY_V1.0</p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="cursor-pointer bg-white text-black p-2 border-2 border-black hover:rotate-10 transition-transform duration-100"
                                >
                                    <X size={24} strokeWidth={3}/>
                                </button>
                            </div>

                            <div className="p-6 space-y-8 pb-20">
                                {SECTIONS.map((group, groupIndex) => (
                                    <m.div
                                        key={group.title}
                                        initial={{y: 20, opacity: 0}}
                                        animate={{y: 0, opacity: 1}}
                                        transition={{delay: groupIndex * 0.1}}
                                        className="relative"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-3 h-3 border-2 border-black ${group.color}`}/>
                                            <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-black w-full pb-1">
                                                {group.title}
                                            </h3>
                                        </div>

                                        <div
                                            className="grid grid-cols-1 gap-3 pl-2 border-l-2 border-black border-dashed ml-1.5">
                                            {group.links.map((link) => (
                                                <button key={link.id} onClick={() => scrollTo(link.id)}
                                                        className={`group relative flex items-center gap-4 p-3 border-2 border-black transition-all text-left shadow-[2px_2px_0px_0px_black] hover:translate-y-1 cursor-pointer active:scale-99 hover:shadow-none ${activeSection === link.id ? 'text-white' : 'bg-gray-50 hover:bg-white text-black'}`}>
                                                    {activeSection === link.id && (
                                                        <m.div
                                                            layoutId="active-bg"
                                                            className="absolute inset-0 bg-black z-0"
                                                            transition={{type: 'spring', stiffness: 300, damping: 30}}
                                                        />
                                                    )}

                                                    <div className="relative z-5 flex items-center gap-4 w-full">
                                                        <div
                                                            className={`p-1.5 border-2 border-current ${activeSection === link.id ? 'bg-white text-black' : group.color}`}>
                                                            <link.icon size={16} strokeWidth={2.5}/>
                                                        </div>
                                                        <span
                                                            className="font-bold uppercase text-sm tracking-tight flex-1">
                                                            {link.label}
                                                        </span>
                                                        {activeSection === link.id && (
                                                            <m.span initial={{opacity: 0}} animate={{opacity: 1}}
                                                                    className="text-[10px] font-mono animate-pulse">
                                                                ●
                                                            </m.span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </m.div>
                                ))}
                            </div>
                        </m.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default React.memo(NavigationHub);