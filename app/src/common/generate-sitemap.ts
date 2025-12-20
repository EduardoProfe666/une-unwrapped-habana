import Sitemap from "@stdian/react-sitemap";
import { writeFileSync } from "fs";

const host = "https://une-unwrapped-habana.vercel.app";
const routes = [
    {
        url: "/",
        priority: 1,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: "monthly",
        images: [`${host}/banner.webp`]
    },
];

const sitemap = new Sitemap(host, routes);
const xml = sitemap.getXml();

writeFileSync("./public/sitemap.xml", xml);
