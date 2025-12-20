import React from 'react';

const SectionLoader = () => (
    <div
        className="w-full h-64 bg-gray-50/50 animate-pulse border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-400 font-bold text-sm font-mono">CARGANDO RECURSOS...</span>
    </div>
);

export default React.memo(SectionLoader);