import {useEffect, useState} from "react";
import {UneAnalysis} from "@/src/lib/types.ts";

export default function useYearAnalysis(selectedYear: number) {
    const [data, setData] = useState<UneAnalysis | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const controller = new AbortController()

        setLoading(true)
        fetch(`/data/analysis_data_${selectedYear}.json`, {
            signal: controller.signal
        })
            .then(r => {
                if (!r.ok) throw new Error()
                return r.json()
            })
            .then(setData)
            .catch(e => {
                if (e.name !== 'AbortError') console.error(e)
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [selectedYear])

    return { data, loading }
}
