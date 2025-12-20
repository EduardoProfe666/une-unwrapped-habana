import Sitemap from "@stdian/react-sitemap";
import {writeFileSync} from "fs";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const host = process.env.VITE_BASE_URL;

if (!host) {
    process.exit(1);
}

const routes = [
    {
        url: "/",
        priority: 1,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: "monthly",
        images: [`${host.replace(/\/$/, '')}/banner.webp`]
    },
];

const sitemap = new Sitemap(host, routes);
const xml = sitemap.getXml();

writeFileSync("./public/sitemap.xml", xml);