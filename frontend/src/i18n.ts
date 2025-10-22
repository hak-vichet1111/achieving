import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Namespaces
import enSidebar from "./locales/en/sidebar.json";
import khSidebar from "./locales/kh/sidebar.json";
import enCommon from "./locales/en/common.json";
import khCommon from "./locales/kh/common.json";
import enGoalDetails from "./locales/en/goalDetails.json";
import khGoalDetails from "./locales/kh/goalDetails.json";
import enGoals from "./locales/en/goals.json";
import khGoals from "./locales/kh/goals.json";
import enTasks from "./locales/en/tasks.json";
import khTasks from "./locales/kh/tasks.json";
import enSpending from "./locales/en/spending.json";
import khSpending from "./locales/kh/spending.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { sidebar: enSidebar, common: enCommon, goalDetails: enGoalDetails, goals: enGoals, tasks: enTasks, spending: enSpending },
      kh: { sidebar: khSidebar, common: khCommon, goalDetails: khGoalDetails, goals: khGoals, tasks: khTasks, spending: khSpending }
    },
    lng: "en",
    fallbackLng: "en",
    ns: ["common", "sidebar", "goalDetails", "goals", "tasks", "spending"],
    defaultNS: "common",
    interpolation: { escapeValue: false }
  });