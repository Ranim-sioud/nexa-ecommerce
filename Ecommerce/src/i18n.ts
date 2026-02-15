import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    lng: "fr",
    fallbackLng: "fr",
    resources: {
      fr: {
        translation: {
          searchPlaceholder: "Rechercher un produit...",
          notifications: "Notifications",
          viewAll: "Voir tout",
          logout: "Déconnexion",
        },
      },
      en: {
        translation: {
          searchPlaceholder: "Search a product...",
          notifications: "Notifications",
          viewAll: "View all",
          logout: "Logout",
        },
      },
    },
  });

export default i18n;