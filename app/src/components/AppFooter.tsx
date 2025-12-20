import React, {memo} from 'react';

interface AppFooterProps {
    year: number;
}

const AppFooter: React.FC<AppFooterProps> = ({year}) => {
    return (
        <footer className="bg-black text-white p-8 mt-24 text-center border-t-4 border-gray-800">
            <p className="font-bold mb-4">
                UNE Unwrapped La Habana {year}
            </p>

            <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-8">
                Esta página no está afiliada a la Empresa Eléctrica de La Habana ni a la Unión Eléctrica.
                Los datos son una aproximación basada en mensajes públicos de Telegram
                y pueden contener errores de interpretación algorítmica.
                NO deben ser tratados como datos oficiales y reales, pues pueden contener
                errores y estar alejados de la estimación real. Solo es para entretenimiento, usar con precaución.
            </p>

            <div className="flex justify-center items-center gap-4">
                <a
                    href="https://t.me/EmpresaElectricaDeLaHabana"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white text-black px-4 py-2 font-bold rounded hover:bg-gray-200"
                >
                    Canal Oficial
                </a>

                <a
                    href="https://eduardoprofe666.github.io"
                    className="opacity-30 hover:opacity-100 transition-opacity text-2xl"
                    title="???"
                >
                    🎩
                </a>
            </div>
        </footer>
    );
};

export default memo(AppFooter);
