import {useEffect, useRef, useState} from "react";
import {UneAnalysis} from "@/src/common/types.ts";

export default function useYearAnalysis(selectedYear: number) {
    const [data, setData] = useState<UneAnalysis | null>(null)
    const [loading, setLoading] = useState(false)
    const cache = useRef<Record<number, UneAnalysis>>({});

    useEffect(() => {
        const controller = new AbortController();

        const loadData = async () => {
            if (cache.current[selectedYear]) {
                setLoading(true);
                // Just for the animation
                await new Promise((resolve) => setTimeout(resolve, 1));
                setData(cache.current[selectedYear]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`/data/analysis_data_${selectedYear}.json`, {
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error();
                const result = await response.json();
                cache.current[selectedYear] = result;
                setData(result);
            } catch (e) {
                if (e.name !== "AbortError") console.error(e);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        return () => controller.abort();
    }, [selectedYear]);

    return { data, loading }
}
