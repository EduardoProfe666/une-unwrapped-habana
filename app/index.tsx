import React, {lazy, Suspense, useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App.tsx';
import './src/styles.css';

// Defer Vercel Analytics + SpeedInsights past first paint so they don't
// compete with the initial render. Loaded only after the browser is idle.
const Analytics = lazy(() =>
    import('@vercel/analytics/react').then(m => ({default: m.Analytics}))
);
const SpeedInsights = lazy(() =>
    import('@vercel/speed-insights/react').then(m => ({default: m.SpeedInsights}))
);

const DeferredTelemetry: React.FC = () => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const fire = () => setReady(true);
        // Prefer requestIdleCallback when available; fallback to a small timeout
        const w = window as Window & {requestIdleCallback?: (cb: () => void, opts?: {timeout: number}) => number};
        if (typeof w.requestIdleCallback === 'function') {
            const id = w.requestIdleCallback(fire, {timeout: 3000});
            return () => {
                const cancel = (window as Window & {cancelIdleCallback?: (id: number) => void}).cancelIdleCallback;
                if (typeof cancel === 'function') cancel(id);
            };
        }
        const t = window.setTimeout(fire, 2000);
        return () => window.clearTimeout(t);
    }, []);

    if (!ready) return null;
    return (
        <Suspense fallback={null}>
            <Analytics/>
            <SpeedInsights/>
        </Suspense>
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App/>
        <DeferredTelemetry/>
    </React.StrictMode>
);
