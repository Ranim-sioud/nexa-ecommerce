import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4001/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

// Interceptor pour refresh token
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Si erreur 401 ET ce n'est pas une requête de refresh
    if (error.response?.status === 401 && 
        !originalRequest.url.includes('/auth/refresh')) {
      
      // Éviter les boucles infinies
      if (originalRequest._retry) {
        console.log("Déjà tenté de rafraîchir, redirection vers login");
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        console.log("Tentative de rafraîchissement du token...");
        // Essayer de rafraîchir le token
        await api.post("/auth/refresh");
        console.log("Token rafraîchi avec succès");
        
        // Relancer la requête originale
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Échec du rafraîchissement:", refreshError);
        
        // Nettoyer localStorage
        localStorage.removeItem("user");
        
        // Rediriger vers login seulement si on n'y est pas déjà
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  config => {
    // NE PAS ajouter le token manuellement - cookies sont automatiques
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);


/* api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const r = await api.post("/auth/refresh");
        const newToken = r.data.accessToken;

        localStorage.setItem("accessToken", newToken);

        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        console.log("refresh failed");
      }
    }

    return Promise.reject(error);
  }
); */

export default api;