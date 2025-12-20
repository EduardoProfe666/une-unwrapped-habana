import React, {memo} from 'react';

interface AppFooterProps {
    year: number;
    color: string;
}

const AppFooter: React.FC<AppFooterProps> = ({year, color}) => {
    return (
        <footer className="mt-32 border-t-8 border-black bg-white p-0 relative overflow-hidden">
            <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle, currentColor 2px, transparent 2px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            <div className="bg-yellow-400 border-b-4 border-black py-2 overflow-hidden whitespace-nowrap relative z-10">
                <div className="flex animate-[scroll_20s_linear_infinite]">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="font-black text-[10px] uppercase tracking-[0.3em] mx-4">
                            PRECAUCIÓN: DATOS NO OFICIALES // PROYECTO INDEPENDIENTE // PUEDE CONTENER ERRORES
                        </span>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

                <div className="space-y-6">
                    <div className={`inline-block bg-black text-white p-6 shadow-[12px_12px_0px_0px] transition-shadow duration-500`}
                         style={{ boxShadow: `12px 12px 0px 0px var(--tw-shadow-color, currentColor)` }}>
                        <div className={`${color} hidden`} id="color-reference" />
                        <h2 className="text-4xl md:text-5xl font-black uppercase leading-none tracking-tighter italic">
                            UNE_UNWRAPPED<br/>
                            HABANA_{year}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`h-1 w-12 ${color}`} />
                        <p className="font-mono text-[10px] font-black uppercase opacity-60 tracking-widest">
                            SYSTEM_LOG_AUDIT_{year}
                        </p>
                    </div>
                </div>

                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_black] relative group hover:shadow-[12px_12px_0px_0px] transition-all"
                     style={{ ['--tw-shadow-color' as any]: `var(--color-value, black)` }}>

                    <span className="absolute -top-4 left-4 bg-black text-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]">
                        LEGAL_INFO
                    </span>

                    <p className="text-xs text-gray-700 font-bold leading-relaxed mb-8 uppercase">
                        <span className="opacity-30"># </span>
                        Esta página no está afiliada a la Empresa Eléctrica de La Habana ni a la Unión Eléctrica.
                        Los datos son una aproximación basada en mensajes públicos del canal de Telegram de la UNE en La Habana.
                        <span className="bg-yellow-100 px-1 italic">Algunos datos pueden presentar discrepancias respecto a la operatividad real del SEN.</span>
                        <span className="bg-red-100 px-1 italic">NO deben ser tratados como datos oficiales y reales.</span>
                        Solo es para entretenimiento, usar con precaución.
                    </p>

                    <div className="flex flex-wrap items-center gap-6">
                        <a
                            href="https://t.me/EmpresaElectricaDeLaHabana"
                            target="_blank"
                            rel="noreferrer"
                            className={`${color} text-black px-6 py-3 font-black uppercase text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all`}
                        >
                            Canal Oficial
                        </a>

                        <a
                            href="https://eduardoprofe666.github.io"
                            target="_blank"
                            className="text-4xl hover:scale-125 transition-transform duration-300 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                        >
                            🎩
                        </a>
                    </div>
                </div>
            </div>

            <div className="bg-black text-white py-6 px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono font-black uppercase tracking-widest border-t-4 border-black/20">
                <div className="flex items-center gap-4">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${color}`} />
                    <span>&copy; {new Date().getFullYear()} UNE_UNWRAPPED_HABANA_PROJECT</span>
                </div>
                <div className="flex gap-8 opacity-50">
                    <span>BUILD: 2.5.0</span>
                    <span>ESTADO: <span className="text-green-400">OPERACIONAL</span></span>
                </div>
            </div>

            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </footer>
    );
};

export default memo(AppFooter);