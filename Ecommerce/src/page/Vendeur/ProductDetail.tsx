import { useState, useEffect, JSX } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  ShoppingCart,
  Download,
  Package,
  Hash,
  Palette,
  Warehouse,
  User,
  Folder,
  Percent,
  TrendingUp,
  FileText,
  Truck,
  AlertTriangle,
  ShirtIcon,
} from "lucide-react";
import JSZip from "jszip";
import ZoomImage from "react-zoom-image-hover";
import ImageMagnifier from "../../components/ImageMagnifier";
import api from "../../components/api";


// --- Fonction pour mapper les noms de couleurs aux codes hexadécimaux ---
const getCouleurStyle = (couleurNom: string) => {
  const couleursMap: { [key: string]: string } = {
    "Rouge": "#ff0000",
    "Bleu": "#0000ff",
    "Vert": "#00ff00",
    "Noir": "#000000",
    "Blanc": "#ffffff",
    "Gris": "#808080",
    "Rose": "#ffc0cb",
    "Jaune": "#ffff00",
    "Orange": "#ffa500",
    "Violet": "#800080",
    "Marron": "#a52a2a",
    "Beige": "#f5f5dc",
    "Or": "#ffd700",
    "Argent": "#c0c0c0",
    "Turquoise": "#40e0d0",
    "Cyan": "#00ffff",
    "Magenta": "#ff00ff",
    "Bordeaux": "#800000",
    "Bleu ciel": "#87ceeb",
    "Bleu marine": "#000080",
    "Bleu roi": "#1e00ff",
    "Bleu clair": "#add8e6",
    "Bleu foncé": "#00008b",
    "Vert clair": "#90ee90",
    "Vert foncé": "#006400",
    "Vert olive": "#808000",
    "Vert kaki": "#78866b",
    "Vert menthe": "#98ff98",
    "Vert fluo": "#39ff14",
    "Jaune clair": "#ffffe0",
    "Jaune foncé": "#ffcc00",
    "Jaune fluo": "#ccff00",
    "Orange clair": "#ffb84d",
    "Orange foncé": "#ff8c00",
    "Rose clair": "#ffb6c1",
    "Rose foncé": "#ff1493",
    "Fuchsia": "#ff00ff",
    "Saumon": "#fa8072",
    "Corail": "#ff7f50",
    "Lavande": "#e6e6fa",
    "Lilac": "#c8a2c8",
    "Mauve": "#e0b0ff",
    "Chocolat": "#d2691e",
    "Café": "#4b371c",
    "Camel": "#c19a6b",
    "Ivoire": "#fffff0",
    "Crème": "#fffdd0",
    "Écru": "#f5f5dc",
    "Anthracite": "#383e42",
    "Ardoise": "#708090",
    "Charbon": "#242124",
    "Taupe": "#483c32",
    "Sable": "#f6d7b0",
    "Cuivre": "#b87333",
    "Bronze": "#cd7f32"
  };

  return couleursMap[couleurNom] || "#cccccc";
};

// --- INTERFACES ---
interface User {
  id: number;
  nom: string;
  email: string;
  ville: string;
  gouvernorat: string;
  identifiant_public?: string;
}

interface Categorie {
  id: number;
  nom: string;
}

interface Media {
  id: number;
  type: string;
  url: string;
  principale: boolean;
}

interface Variation {
  id: number;
  couleur: string;
  taille: string;
  prix_gros: number;
  stock: number;
  id_externe: string;
}

interface Produit {
  id: number;
  code: string;
  nom: string;
  description: string;
  livraison: string;
  prix_gros: number;
  stock: number;
  rupture_stock: boolean;
  id_fournisseur: number;
  id_categorie: number;
  createdAt: string;
  updatedAt: string;
  medias: Media[];
  variations: Variation[];
  categorie: Categorie;
  fournisseur: User;
}

interface InfoRowProps {
  icon: JSX.Element;
  label: string;
  value: string | number;
  isHighlighted?: boolean;
}

const InfoRow = ({ icon, label, value, isHighlighted = false }: InfoRowProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center text-gray-700">
      {icon}
      <span className="ml-2 font-semibold">{label}</span>
    </div>
    <span className={`font-semibold ${isHighlighted ? 'text-teal-400' : 'text-gray-500'}`}>
      {value}
    </span>
  </div>
);

// --- COMPOSANT PRINCIPAL ---
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [produit, setProduit] = useState<Produit | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [imagePrincipale, setImagePrincipale] = useState(0);
  const [telechargementEnCours, setTelechargementEnCours] = useState(false);
  const [dansMesProduits, setDansMesProduits] = useState(false);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          alert("⏳ Trop de requêtes ! Attendez quelques secondes avant de réessayer.");
          return Promise.reject(error);
        }
        if (error.response?.status === 401) {
          // Ici seulement tu rediriges vers /login
          localStorage.removeItem("accessToken");
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);
  useEffect(() => {
    const chargerProduit = async () => {
      try {
        const response = await api.get(`/produits/${id}`);
        setProduit(response.data);

        if (response.data.variations && response.data.variations.length > 0) {
          setSelectedVariation(response.data.variations[0]);
        }
      } catch (error) {
        console.error("Erreur chargement produit:", error);
      } finally {
        setLoading(false);
      }
    };
    chargerProduit();
  }, [id]);

  const demanderVerificationStock = async () => {
    if (!produit) return alert("Produit non chargé.");
  
    try {  
      // 1️⃣ Récupérer l’ID du type "Confirmation Stock"
      const resType = await api.get(`/tickets/types`);
  
      const type = resType.data.types.find((t: any) => t.name === "Confirmation Stock");
      if (!type) {
        alert("Type 'Confirmation Stock' introuvable. Merci de le créer côté admin.");
        return;
      }
  
      // 2️⃣ Créer le ticket
      const payload = {
        title: "Confirmation de stock",
        product_code: produit.code,
        type_id: type.id,
        initial_message: `${produit.nom}`
      };
  
      const res = await api.post(`/tickets`, payload);
  
      if (res.data.tickets) {
        alert("✅ Ticket de confirmation de stock créé avec succès !");
      } else {
        alert("❌ Une erreur est survenue lors de la création du ticket.");
      }
    } catch (error) {
      console.error("Erreur création ticket:", error);
      alert("Erreur lors de la demande de vérification de stock.");
    }
  };

  const ajouterAuxProduits = async () => { 
    console.log("Ajout aux produits..."); 
  };

  // --- FONCTION PRINCIPALE DE TÉLÉCHARGEMENT ZIP ---
  const telechargerMediasEnZip = async () => {
  if (!produit || !produit.medias || produit.medias.length === 0) {
    alert("Aucun média disponible pour ce produit.");
    return;
  }

  setTelechargementEnCours(true);

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Veuillez vous reconnecter");
      window.location.href = "/auth/login";
      return;
    }

    const zip = new JSZip();
    const nomDossier = produit.nom.replace(/[^a-zA-Z0-9]/g, '_');
    const dossier = zip.folder(nomDossier);

    if (!dossier) {
      throw new Error("Impossible de créer le dossier dans le ZIP");
    }

    // Limiter le nombre de requêtes parallèles
    const BATCH_SIZE = 2; // 2 requêtes à la fois
    const batches = [];
    
    for (let i = 0; i < produit.medias.length; i += BATCH_SIZE) {
      batches.push(produit.medias.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const promises = batch.map(async (media, indexInBatch) => {
        const globalIndex = batchIndex * BATCH_SIZE + indexInBatch;
        
        try {
          const response = await api.get(media.url, {
            responseType: "arraybuffer",
            timeout: 30000
          });

          const extension = media.type === 'video' ? 'mp4' : 
                           media.url.includes('.jpg') ? 'jpg' :
                           media.url.includes('.png') ? 'png' :
                           media.url.includes('.jpeg') ? 'jpeg' : 'jpg';
          
          const nomFichier = `${nomDossier}_${globalIndex + 1}.${extension}`;
          dossier.file(nomFichier, response.data);
          
        } catch (error) {
          console.error(`Erreur avec le média ${globalIndex + 1}:`, error);
          // Continuer avec les autres médias même si un échoue
          dossier.file(`erreur_media_${globalIndex + 1}.txt`, `Impossible de télécharger: ${media.url}, Erreur: ${error.message}`);
        }
      });

      // Attendre que le batch courant termine avant de passer au suivant
      await Promise.all(promises);
      
      // Délai entre les batches pour éviter le rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Générer le ZIP
    const content = await zip.generateAsync({ 
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    // Télécharger
    const blobUrl = window.URL.createObjectURL(content);
    const lien = document.createElement('a');
    lien.href = blobUrl;
    lien.download = `medias_${nomDossier}.zip`;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    window.URL.revokeObjectURL(blobUrl);
    
    alert(`✅ Tous les médias (${produit.medias.length}) ont été téléchargés !`);
    
  } catch (error) {
    console.error('Erreur lors de la création du ZIP:', error);
    
    if (error.response?.status === 429) {
      alert('❌ Trop de requêtes. Veuillez réessayer dans quelques instants.');
    } else if (error.response?.status === 401) {
      alert('❌ Session expirée. Veuillez vous reconnecter.');
      localStorage.removeItem("accessToken");
      window.location.href = "/auth/login";
    } else {
      alert('❌ Une erreur est survenue lors du téléchargement.');
    }
  } finally {
    setTelechargementEnCours(false);
  }
};

  // Version alternative si JSZip ne fonctionne pas
  const telechargerMediasAvecAPI = async () => {
    if (!produit || !produit.medias || produit.medias.length === 0) {
      alert("Aucun média disponible pour ce produit.");
      return;
    }

    setTelechargementEnCours(true);

    try {      
      // Essayer d'abord avec l'endpoint ZIP du backend s'il existe
      const response = await api.get(`/produits/${id}/medias/zip`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      const nomProduitSecurise = produit.nom.replace(/[^a-zA-Z0-9]/g, '_');
      const lien = document.createElement('a');
      lien.href = blobUrl;
      lien.download = `medias_${nomProduitSecurise}.zip`;
      lien.style.display = 'none';
      
      document.body.appendChild(lien);
      lien.click();
      document.body.removeChild(lien);
      
      window.URL.revokeObjectURL(blobUrl);
      
      alert(`✅ Tous les médias ont été téléchargés dans un fichier ZIP !`);
    } catch (error) {
      console.error('Erreur avec l\'endpoint ZIP:', error);
      // Si l'endpoint ZIP n'existe pas, utiliser JSZip
      await telechargerMediasEnZip();
    } finally {
      setTelechargementEnCours(false);
    }
  };

  useEffect(() => {
    const verifier = async () => {
      const res = await api.get(`/mesProduits`);
      if (res.data.some((p: any) => p.Produit.id === Number(id))) {
        setDansMesProduits(true);
      }
    };
    verifier();
  }, [id])  ;
  
  const toggleMesProduits = async () => {
    if (dansMesProduits) {
      await api.delete(`/mesProduits/${id}`);
      setDansMesProduits(false);
    } else {
      await api.post(`/mesProduits/${id}`, {});
      setDansMesProduits(true);
    }
  };


  if (loading) {
    return <div className="text-center py-16">Chargement du produit...</div>;
  }

  if (!produit) {
    return <div className="text-center py-16 text-red-500">Produit non trouvé.</div>;
  }

  const mediaActuel = produit.medias[imagePrincipale];
  const mediasTries = produit.medias
  ? [...produit.medias].sort((a, b) => {
      if (a.type === "image" && b.type === "video") return -1; 
      if (a.type === "video" && b.type === "image") return 1;
      return 0;
    })
  : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* BANNIÈRE D'ALERTE */}
        <div className="bg-pink-600 text-white p-3 rounded-lg flex items-center justify-center text-sm shadow-md">
          <AlertTriangle size={20} className="mr-3 flex-shrink-0" />
          <p>Avant de lancer des campagnes publicitaires, veuillez confirmer la disponibilité du stock du produit avec l'équipe.</p>
        </div>
        
        {/* SECTION PRINCIPALE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-6 rounded-lg shadow-sm">
          
          {/* GALERIE D'IMAGES */}
          <div>
            <CardContent className="p-4">
              <div className="flex gap-4 items-start">
                {/* Image Principale */}
                <div className="aspect-square flex-grow w-full max-w-lg rounded-xl overflow-hidden group">
                  {mediasTries && mediasTries.length > 0 ? (
                    mediasTries[imagePrincipale].type === "video" ? (
                      <video controls className="w-full h-full object-contain">
                        <source
                          src={mediasTries[imagePrincipale].url}
                          type="video/mp4"
                        />
                      </video>
                    ) : (
                      <ImageMagnifier
                        src={mediasTries[imagePrincipale].url}
                        zoom={2.5}
                        size={130}
                        className="rounded-lg"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                      📦 Aucun média disponible
                    </div>
                  )}
                </div>

                {/* Vignettes */}
                {mediasTries && mediasTries.length > 0 && (
                  <div className="flex flex-col gap-2 flex-shrink-0 mt-8">
                    {mediasTries.map((media, index) => (
                      <button
                        key={media.id}
                        onClick={() => setImagePrincipale(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                          imagePrincipale === index
                            ? "border-pink-600"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {media.type === "video" ? (
                          <div className="bg-black flex items-center justify-center h-full text-white">
                            ▶
                          </div>
                        ) : (
                          <img
                            src={media.url}
                            alt={`media ${index}`}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          {/* INFORMATIONS DU PRODUIT */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800">{produit.nom}</h1>
            <p className="text-sm text-gray-500 mb-4">{produit.categorie.nom}</p>
            <p className="text-4xl font-bold text-gray-900 mb-6">{produit.prix_gros} TND</p>

            {/* Variations */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2 text-gray-700">Variations du Produit</h3>
              <div className="flex gap-2 flex-wrap">
                {produit.variations.length === 0 ? (
                  <div className="text-sm text-gray-500 p-2 border rounded-lg bg-gray-50 w-full">
                    Pas d'attribut disponible
                  </div>
                ) : (
                  produit.variations.map((v) => (
                    <Button
                      key={v.id}
                      variant="outline"
                      onClick={() => setSelectedVariation(v)}
                      className={selectedVariation?.id === v.id ? "border-2 border-black bg-white text-gray-800" : "text-gray-700"}
                    >
                      <span 
                        className={`w-3 h-3 rounded-full mr-2 ${v.couleur.toLowerCase() === 'blanc' ? 'border border-gray-300' : ''}`}
                        style={{ backgroundColor: getCouleurStyle(v.couleur) }}
                      ></span> 
                      {v.couleur} - Taille {v.taille}
                    </Button>
                  ))
                )}
              </div>
            </div>

            {/* Informations de variation */}
            {selectedVariation && (
              <div className="space-y-3 text-sm border-t border-b py-4">
                <InfoRow icon={<Hash size={16}/>} label="Code variation du produit" value={selectedVariation.id_externe || "N/A"} />
                <InfoRow icon={<Palette size={16}/>} label="Couleur" value={selectedVariation.couleur || "N/A"} />
                <InfoRow icon={<ShirtIcon size={16}/>} label="Taille" value={selectedVariation.taille || "N/A"}  />
                <InfoRow icon={<Package size={16}/>} label="Stock (Variation)" value={`${selectedVariation.stock} Disponible`} isHighlighted={selectedVariation.stock > 0} />
                
              </div>
            )}

            {/* Informations produit */}
            <div className="space-y-3 text-sm mt-4">
              <h3 className="text-md font-semibold mb-2 text-gray-700">Informations Produit</h3>
              <InfoRow 
                icon={<Warehouse size={16}/>} 
                label="Stock Global" 
                value={`${produit.stock} Unités`} 
                isHighlighted={produit.stock > 0} 
              />
              <InfoRow icon={<Hash size={16}/>} label="Code produit" value={produit.code} />
              <InfoRow icon={<User size={16}/>} label="Fournisseur" value={produit.fournisseur?.identifiant_public || "N/A"} />
              <InfoRow icon={<Folder size={16}/>} label="Catégorie" value={produit.categorie.nom} />
              <InfoRow icon={<Percent size={16}/>} label="Marge recommandée (%)" value="30%" />
            </div>

            {/* Boutons d'action */}
            <div className="mt-auto pt-6 space-y-3">
              <div className="flex items-center justify-between border border-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 max-w-xs">Cliquer sur "Vérification de Stock" créera un ticket de support demandant à un administrateur de vérifier le stock de ce produit.</p>
                <Button onClick={demanderVerificationStock} className="bg-teal-400 hover:bg-teal-600 text-white flex-shrink-0">
                  Vérification de Stock
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={toggleMesProduits}
                  className={`w-full ${dansMesProduits ? "border border-pink-600 bg-white text-pink-600 hover:bg-gray-50" : "bg-teal-400 hover:bg-teal-600"}`}
                >
                  <ShoppingCart size={16} className="mr-2" />
                  {dansMesProduits ? "Retirer de mes produits" : "Ajouter à mes produits"}
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                  onClick={telechargerMediasEnZip}
                  disabled={telechargementEnCours || !produit.medias || produit.medias.length === 0}
                >
                  <Download size={16} className="mr-2" /> 
                  {telechargementEnCours ? "Création du ZIP..." : "Télécharger les médias (ZIP)"}
                </Button>
              </div>
              
              {/* Information sur le contenu du ZIP */}
              {produit.medias && produit.medias.length > 0 && (
                <div className="text-center text-xs text-gray-500 mt-2">
                  Le ZIP contiendra {produit.medias.length} média(s) dans le dossier "{produit.nom.replace(/[^a-zA-Z0-9]/g, '_')}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION INFÉRIEURE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-bold text-lg mb-3 flex items-center"><FileText size={20} className="mr-2 text-gray-500"/> Description du produit</h2>
            <div className="text-sm text-gray-600 prose" dangerouslySetInnerHTML={{ __html: produit.description }}/>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-bold text-lg mb-3 flex items-center"><Truck size={20} className="mr-2 text-gray-500"/> Détails de livraison</h2>
            <div className="text-sm text-gray-600 prose" dangerouslySetInnerHTML={{ __html: produit.livraison }}/>
          </div>
        </div>
      </div>
    </div>
  );
}