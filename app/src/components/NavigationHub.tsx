import React, {useEffect, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {
    Award,
    BarChart2,
    Calendar,
    Clock,
    Hash,
    Layers,
    Map,
    MessageSquare,
    MousePointer2,
    Search,
    TrendingUp,
    X,
    Zap
} from 'lucide-react';

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
        title: "01_MÉTRICAS_BASE",
        color: "bg-blue-400",
        links: [
            {id: "totals-grid", label: "Resumen General", icon: Hash},
            {id: "averages", label: "Medias por Mensaje", icon: TrendingUp},
            {id: "daily-activity", label: "Flujo de Mensajes", icon: BarChart2},
        ]
    },
    {
        title: "02_INFRAESTRUCTURA",
        color: "bg-yellow-400",
        links: [
            {id: "blocks-analysis", label: "Resumen por Bloque", icon: Layers},
            {id: "weekly-block-matrix", label: "Matriz Semanal", icon: Calendar},
            {id: "sen-status", label: "Estado del SEN", icon: Zap},
        ]
    },
    {
        title: "03_ANÁLISIS_TEMPORAL",
        color: "bg-green-400",
        links: [
            {id: "monthly-charts", label: "Evolución Mensual", icon: TrendingUp},
            {id: "distribution", label: "Tipos de Mensajes", icon: BarChart2},
            {id: "reaction-spectrum", label: "Espectro de Reacciones", icon: MousePointer2},
        ]
    },
    {
        title: "04_SOCIAL_Y_TEXTO",
        color: "bg-red-400",
        links: [
            {id: "word-cloud", label: "Nube de Conceptos", icon: MessageSquare},
            {id: "text-stats", label: "Hitos Temporales", icon: Clock},
            {id: "extremes", label: "Longitud Crítica", icon: Search},
            {id: "top-lists", label: "Rankings de Impacto", icon: Award},
        ]
    }
];

const NavigationHub: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('');

    useEffect(() => {
        const handleScroll = () => {
            const sections = SECTIONS.flatMap(g => g.links.map(l => l.id));
            const current = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return rect.top >= 0 && rect.top <= window.innerHeight / 2;
                }
                return false;
            });
            if (current) setActiveSection(current);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({behavior: 'smooth'});
            setIsOpen(false);
        }
    };

    return (
        <>
            <m.button
                initial={{scale: 0}}
                animate={{scale: 1}}
                whileTap={{scale: 0.95}}
                onClick={() => setIsOpen(true)}
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
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        <m.div
                            initial={{x: '-100%', opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            exit={{x: '-100%', opacity: 0}}
                            transition={{type: "spring", damping: 25, stiffness: 200}}
                            className="fixed top-0 left-0 h-full w-full md:w-[480px] bg-white border-r-4 border-black z-[60] overflow-y-auto shadow-[20px_0px_0px_0px_rgba(0,0,0,0.2)]"
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
                                    onClick={() => setIsOpen(false)}
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