import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

const GithubSupport: React.FC<{ accentColor: string }> = ({ accentColor }) => {
    const [stars, setStars] = useState<number | null>(null);

    useEffect(() => {
        fetch('https://api.github.com/repos/EduardoProfe666/une-unwrapped-habana')
            .then(res => res.json())
            .then(data => {
                setStars(data.stargazers_count ? data.stargazers_count : 0)
            })
            .catch(() => setStars(null));
    }, []);

    return (
        <section className="flex justify-center px-4 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-black/5 -z-10" />

            <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_black] max-w-4xl w-full relative overflow-hidden group/card">

                <img
                    src="/images/github-mark.svg"
                    alt=""
                    className="absolute -right-10 -bottom-10 w-64 h-64 opacity-[0.03] -rotate-12 pointer-events-none group-hover/card:rotate-0 transition-transform duration-700"
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">

                    <div className="shrink-0 relative">
                        <div className={`absolute inset-0 ${accentColor} blur-2xl opacity-20 animate-pulse`} />
                        <div className="relative bg-black p-6 border-4 border-black shadow-[4px_4px_0px_0px_#ccc]">
                            <img
                                src="/images/github-mark.svg"
                                alt="GitHub Logo"
                                className="w-16 h-16 invert"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 border-2 border-black px-1 text-[8px] font-black uppercase">
                            Ext_Repo_v1
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-black tracking-widest uppercase mb-2">
                            Open_Source_Contribution
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">
                            Apoya el <br/>Desarrollo
                        </h2>
                        <p className="font-mono text-xs font-bold opacity-60 max-w-md">
                            Este proyecto es código abierto y gratuito. Una estrella en GitHub ayuda a que más personas conozcan el estado del SEN en La Habana.
                        </p>
                    </div>

                    <a
                        href="https://github.com/EduardoProfe666/une-unwrapped-habana"
                        target="_blank"
                        rel="noreferrer"
                        className={`group flex flex-col items-center gap-2 px-10 py-6 border-4 border-black font-black transition-all shadow-[8px_8px_0px_0px_black] hover:shadow-none hover:translate-x-2 hover:translate-y-2 ${accentColor} text-white min-w-[220px]`}
                    >
                        <div className="flex items-center gap-3 text-2xl tracking-tighter">
                            <Star className="group-hover:rotate-144 transition-transform duration-500" fill="currentColor" size={28} />
                            <span>DAR ESTRELLA</span>
                        </div>

                        <div className="w-full h-1 bg-black my-2" />

                        <div className="flex flex-col items-center w-full">
                            <span className="text-[9px] uppercase tracking-[0.3em] font-black text-black mb-1">
                                GitHub_Stargazers
                            </span>

                            <div className="bg-black w-full py-2 px-4 flex justify-center items-center border-2 border-white/20 shadow-inner">
                                <span className="text-5xl md:text-7xl font-mono tracking-tighter text-yellow-400 z-20 relative italic animate-pulse">
                                    {stars ? stars.toString().padStart(2, '0') : '--'}
                                </span>
                            </div>

                            <span className="text-[10px] mt-2 font-bold text-black/70">
                                {stars === 1 ? 'ESTRELLA' : 'ESTRELLAS'} ACTUALES
                            </span>
                        </div>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default GithubSupport;