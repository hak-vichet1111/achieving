import { initReactI18next } from "react-i18next";
import enSidebar from "./locales/en/sidebar.json";

import khSidebar from "./locales/kh/sidebar.json";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { sidebar: enSidebar },
            kh: { sidebar: khSidebar }
        },
        lng: "en",
        fallbackLng: "en",
        ns: ["sidebar"], // declare namespace
        defaultNS: "sidebar",
        interpolation: { escapeValue: false }
    });