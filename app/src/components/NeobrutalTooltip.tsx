import {m} from "framer-motion";
import React from "react";

const NeobrutalTooltip = ({ text }: { text: string }) => (
    <m.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute bottom-full left-0 mb-2 z-99999 bg-black text-white p-2 text-[11px] font-bold border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] pointer-events-none min-w-[150px] text-center"
    >
        {text}
    </m.div>
);

export default React.memo(NeobrutalTooltip);