// utils/auth.js
import api from '../api'; // votre instance axios configurée

export async function logout() {
  try {
    // 1. Appeler l'endpoint logout du backend
    await api.post('/auth/logout');
  } catch (err) {
    console.error('Erreur lors de la déconnexion côté serveur:', err);
  } finally {
    // 2. Nettoyer le frontend quoi qu'il arrive
    localStorage.removeItem('user');
    
    // 3. Optionnel: Rediriger vers la page de login
    if (!window.location.pathname.includes('/auth/login')) {
      window.location.href = '/auth/login';
    }
  }
}