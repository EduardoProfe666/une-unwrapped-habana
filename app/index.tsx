import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App.tsx';
import './src/styles.css';
import {Analytics} from "@vercel/analytics/react";
import {SpeedInsights} from "@vercel/speed-insights/react";

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App/>
        <Analytics/>
        <SpeedInsights/>
    </React.StrictMode>
);