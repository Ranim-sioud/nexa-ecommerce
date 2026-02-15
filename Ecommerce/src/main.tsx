import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // <-- Ajouter
import App from "./App";
import { LanguageProvider } from "./context/LanguageContext";
import 'react-quill/dist/quill.snow.css';
import "./index.css";
import "@fontsource/inter";
import "./i18n";


createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
  <LanguageProvider>
    <App />
  </LanguageProvider>
  </BrowserRouter>
);
 