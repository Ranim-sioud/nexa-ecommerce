import { useEffect, useState } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Select from "react-select";
import api from "../../components/api";
const getCouleurStyle = (couleurNom) => {
  const couleursMap = {
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
  return couleursMap[couleurNom] || "#cccccc"; // Couleur par défaut si non trouvée
}

// ---------------- Interfaces ----------------
export interface Produit {
  id: number;
  nom: string;
  description: string;
  livraison: string;
  prix_gros: number;
  stock: number;
  code: string;
  id_externe: string;
  medias: { id: number; url: string; type: string }[];
  variations: { id?: number; couleur: string; taille: string; prix_gros: number; stock: number, id_externe: string }[];
  categorie: { id: number; nom: string } | null;
  rupture_stock?: boolean;
}

export interface Categorie {
  id: number;
  nom: string;
}

interface AddProductProps {
  produit?: Produit;
  onCancel: () => void;
  onSaved: () => void;
}

export default function AddProduct({ produit, onCancel, onSaved }: AddProductProps) {
  const [form, setForm] = useState<any>({
    nom: "",
    description: "",
    livraison: "",
    prix_gros: "",
    stock: "",
    code: "",
    id_externe: "",
    id_categorie: "",
    medias: [],
    variations: [],
  });

  const [previewMedias, setPreviewMedias] = useState<any[]>([]);
  const [existingMedias, setExistingMedias] = useState<any[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [newVariation, setNewVariation] = useState<any>({
    couleur: "",
    taille: "",
    prix_gros: "",
    stock: "",
    id_externe: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("general");

  const couleursDisponibles = [
    "Rouge", "Bleu", "Vert", "Noir", "Blanc", "Gris", "Rose", "Jaune", "Orange",
    "Violet", "Marron", "Beige", "Or", "Argent", "Turquoise", "Cyan", "Magenta",
    "Bordeaux", "Bleu ciel", "Bleu marine", "Bleu roi", "Bleu clair", "Bleu foncé",
    "Vert clair", "Vert foncé", "Vert olive", "Vert kaki", "Vert menthe", "Vert fluo",
    "Jaune clair", "Jaune foncé", "Jaune fluo", "Orange clair", "Orange foncé",
    "Rose clair", "Rose foncé", "Fuchsia", "Saumon", "Corail", "Lavande", "Lilac",
    "Mauve", "Chocolat", "Café", "Camel", "Ivoire", "Crème", "Écru",
    "Anthracite", "Ardoise", "Charbon", "Taupe", "Sable", "Cuivre", "Bronze"
  ];

  const colorOptions = couleursDisponibles.map((c) => ({
    value: c,
    label: c,
    color: getCouleurStyle(c), // tu peux définir une couleur CSS correspondante
  }));

  const taillesVetements = [
    "XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"
  ];
  const taillesChaussures = [
    "16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"
  ];
  const taillesEnfants = [
    "0-3 mois", "3-6 mois", "6-9 mois", "9-12 mois", 
    "12-18 mois", "18-24 mois", 
    "2 ans", "3 ans", "4 ans", "5 ans", "6 ans", "7 ans", 
    "8 ans", "9 ans", "10 ans", "12 ans", "14 ans"
  ];
  const taillesGenerales = [
    "Petit", "Moyen", "Grand", "Très grand",
    "Unique", "Taille ajustable", "Standard"
  ];
  const taillesDisponibles = [
    ...taillesVetements,
    ...taillesChaussures,
    ...taillesEnfants,
    ...taillesGenerales
  ];
  const [couleurDropdownOpen, setCouleurDropdownOpen] = useState(false);

  useEffect(() => {
    if (produit) {
      setForm({
        nom: produit.nom || "",
        description: produit.description || "",
        livraison: produit.livraison || "",
        prix_gros: produit.prix_gros || "",
        stock: produit.stock || "",
        code: produit.code || "",
        id_externe: produit.id_externe || "",
        id_categorie: produit.categorie?.id || "",
        medias: [],
        variations: produit.variations || [],
      });
      setExistingMedias(produit.medias || []);
    }
  }, [produit]);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Erreur chargement catégories :", err));
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nom.trim()) newErrors.nom = "Le nom du produit est requis";
    if (!form.description.trim()) newErrors.description = "La description du produit est requise";
    if (!form.livraison.trim()) newErrors.livraison = "Les détails de livraison du produit sont requis";
    if (!form.prix_gros || parseFloat(form.prix_gros) < 0) newErrors.prix_gros = "Le prix du produit est requis et doit être >= 0";
    if (!form.stock || parseInt(form.stock) < 0) newErrors.stock = "Le stock est requis et doit être >= 0";
    if (!form.id_categorie) newErrors.id_categorie = "La sélection d'une catégorie pour le produit est requise";
    
    if (form.variations.length > 0) {
      form.variations.forEach((v: any, i: number) => {
        if (!v.prix_gros || parseFloat(v.prix_gros) < 0) {
          newErrors[`variation-prix-${i}`] = "Prix requis et >= 0";
        }
        if (!v.stock || parseInt(v.stock) < 0) {
          newErrors[`variation-stock-${i}`] = "Stock requis et >= 0";
        }
      });
    }

    if (form.variations.length === 1) {
      const v = form.variations[0];
      const globalStock = parseInt(form.stock || "0", 10);
      if (v.stock !== undefined && String(v.stock).trim() !== "") {
        const vStock = parseInt(v.stock, 10);
        if (isNaN(vStock) || vStock !== globalStock) {
          newErrors[`variation-stock-0`] = `Le stock de la seule variation doit être égal au stock global (${globalStock}).`;
        }
      }
      // prix non obligatoire ici
    } else if (form.variations.length > 1) {
      let sommeStock = 0;
      form.variations.forEach((v: any, i: number) => {
        if (v.prix_gros === "" || isNaN(parseFloat(v.prix_gros))) {
          newErrors[`variation-prix-${i}`] = "Prix requis et >= 0";
        }
        if (v.stock === "" || isNaN(parseInt(v.stock))) {
          newErrors[`variation-stock-${i}`] = "Stock requis et >= 0";
        } else {
          sommeStock += parseInt(v.stock, 10);
        }
      });
      if (!newErrors[`variation-stock-0`] && sommeStock !== parseInt(form.stock || "0", 10)) {
        newErrors["variations-sum"] = `La somme des stocks des variations (${sommeStock}) doit être égale au stock global (${form.stock}).`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + form.medias.length + existingMedias.length > 10) {
      alert("Maximum 10 fichiers autorisés");
      return;
    }
    const updatedFiles = [...form.medias, ...files];
    setForm({ ...form, medias: updatedFiles });

    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
      file,
    }));
    setPreviewMedias((prev) => [...prev, ...newPreviews]);
  };
  const handleRemoveMedia = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      const updatedExisting = [...existingMedias];
      updatedExisting.splice(index, 1);
      setExistingMedias(updatedExisting);
    } else {
      const updatedMedias = form.medias.filter((_: any, i: number) => i !== index);
      setForm({ ...form, medias: updatedMedias });
      const updatedPreviews = previewMedias.filter((_: any, i: number) => i !== index);
      setPreviewMedias(updatedPreviews);
    }
  };

  const updateVariation = (index: number, field: string, value: any) => {
    const updatedVariations = [...form.variations];
    updatedVariations[index][field] = value;
    setForm({ ...form, variations: updatedVariations });
  };

  const handleAddVariation = () => {
  const globalStock = parseInt(form.stock || "0", 10);

  if (form.variations.length === 0) {
    // Une seule variation → couleur OU taille requis
    if (!newVariation.couleur && !newVariation.taille) {
      alert("Pour une seule variation, au moins la couleur ou la taille doit être remplie");
      return;
    }
    // Si l'utilisateur renseigne un stock pour la seule variation -> il doit être égal au stock global
    if (newVariation.stock !== undefined && String(newVariation.stock).trim() !== "") {
      const nvStock = parseInt(newVariation.stock, 10);
      if (isNaN(nvStock)) {
        alert("Stock de variation invalide");
        return;
      }
    }
    // On met la variation.stock = stock global si il n'a pas été renseigné
    const stockValue = (newVariation.stock !== undefined && String(newVariation.stock).trim() !== "")
      ? parseInt(newVariation.stock, 10)
      : globalStock;
    const variationToAdd = {
      ...newVariation,
      prix_gros: newVariation.prix_gros ? parseFloat(newVariation.prix_gros) : "",
      stock: stockValue,
    };
    setForm({ ...form, variations: [variationToAdd] });
  } else {
    // Plusieurs variations → tout obligatoire
    if (!newVariation.couleur || !newVariation.taille || newVariation.prix_gros === "" || newVariation.stock === "") {
      alert("Toutes les propriétés sont obligatoires lorsque plusieurs variations sont ajoutées");
      return;
    }
    const variationToAdd = {
      ...newVariation,
      prix_gros: parseFloat(newVariation.prix_gros),
      stock: parseInt(newVariation.stock, 10),
    };
    setForm({ ...form, variations: [...form.variations, variationToAdd] });
  }
  setNewVariation({ couleur: "", taille: "", prix_gros: "", stock: "", id_externe: "" });
};

  const handleRemoveVariation = (index: number) => {
    const updatedVariations = form.variations.filter((_: any, i: number) => i !== index);
    setForm({ ...form, variations: updatedVariations });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const API_BASE = "http://localhost:4001";

      // Ajout des champs généraux
      Object.keys(form).forEach((key) => {
        if (key !== "medias" && key !== "variations") {
          if (form[key] !== undefined && form[key] !== null && form[key] !== "") {
            formData.append(key, form[key]);
          }
        }
      });
      // Nouveaux médias
      form.medias.forEach((f: File) => {
        formData.append("medias", f);
      });
      // Médias existants à conserver
      if (existingMedias.length > 0) {
        formData.append("existingMediaIds", JSON.stringify(existingMedias.map(m => m.id)));
      }
      // Variations
      if (form.variations.length > 0) {
       const variationsPayload = form.variations.map((v: any) => {
         const variationData: any = {
           couleur: v.couleur,
           taille: v.taille,
           prix_gros: v.prix_gros,
           stock: v.stock,
           id_externe: v.id_externe || "",
         };       
         // Inclure l'ID si c'est une mise à jour
         if (produit && v.id) {
           variationData.id = v.id;
         }       
         return variationData;
       });       

       formData.append("variations", JSON.stringify(variationsPayload));
      }
      const totalVariationStock = form.variations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      if (form.variations.length === 1) {
        const vStock = parseInt(form.variations[0].stock, 10);
        if (vStock !== parseInt(form.stock, 10)) {
          alert(`Le stock de la seule variation (${vStock}) doit être égal au stock global (${form.stock}).`);
          return;
        }
      }
      if (form.variations.length > 1 && totalVariationStock !== parseInt(form.stock)) {
        alert("La somme des stocks des variations doit être égale au stock global du produit.");
        return;
      }
      // Médias à supprimer
      if (produit) {
        const mediasToDelete = produit.medias.filter(media => 
          !existingMedias.some(m => m.id === media.id)
        ).map(media => media.id);
        
        if (mediasToDelete.length > 0) {
          formData.append("mediasToDelete", JSON.stringify(mediasToDelete));
        }
      }
      const url = produit
        ? `${API_BASE}/api/produits/${produit.id}`
        : `${API_BASE}/api/produits`;
      const method = produit ? "put" : "post";
      await axios[method](url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      alert(produit ? "Produit modifié !" : "Produit ajouté !");
      onSaved();
      onCancel();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
       alert("Erreur : " + err.response.data.message);
      } else {
        alert("Erreur serveur : " + (err.message || "Erreur inconnue"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quill toolbar modules & formats
  const quillModules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ header: [1, 2, 3, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  };
  
  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "code-block",
    "list",
    "bullet",
    "link",
    "image",
    "align",
    "color",
    "background",
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {produit ? "Modifier le produit" : "Ajouter un nouveau produit"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {produit ? "Modifiez les informations du produit" : "Remplissez les informations pour créer un produit"}
          </p>
        </div>
        <button
          onClick={onCancel}
          aria-label="Retour"
          className="px-3 py-2 rounded-full hover:bg-gray-100 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-3 pt-4 text-sm font-medium ${activeTab === "general" ? "text-pink-600 border-b-2 border-pink-400" : "text-gray-500 hover:text-gray-700"}`}
          >
            Informations générales
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`pb-3 pt-4 text-sm font-medium ${activeTab === "media" ? "text-pink-600 border-b-2 border-pink-400" : "text-gray-500 hover:text-gray-700"}`}
          >
            Médias
          </button>
          <button
            onClick={() => setActiveTab("variations")}
            className={`pb-3 pt-4 text-sm font-medium ${activeTab === "variations" ? "text-pink-600 border-b-2 border-pink-500" : "text-gray-500 hover:text-gray-700"}`}
          >
            Variations
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className={`w-full px-4 py-3 border ${errors.nom ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 transition`}
              />
              {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={form.id_categorie}
                onChange={(e) => setForm({ ...form, id_categorie: e.target.value })}
                className={`w-full px-4 py-3 border ${errors.id_categorie ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 bg-white`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
              {errors.id_categorie && <p className="text-red-600 text-sm mt-1">{errors.id_categorie}</p>}
            </div>

            {/* Description - WYSIWYG */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="quill-wrapper rounded-lg overflow-hidden border border-gray-200">
                <ReactQuill
                  theme="snow"
                  value={form.description}
                  onChange={(value) => setForm({ ...form, description: value })}
                  modules={quillModules}
                  formats={quillFormats}
                  className="quill-editor bg-white"
                />
              </div>
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Livraison - WYSIWYG */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Détails de livraison <span className="text-red-500">*</span>
              </label>
              <div className="quill-wrapper rounded-lg overflow-hidden border border-gray-200">
                <ReactQuill
                  theme="snow"
                  value={form.livraison}
                  onChange={(value) => setForm({ ...form, livraison: value })}
                  modules={quillModules}
                  formats={quillFormats}
                  className="quill-editor bg-white"
                />
              </div>
              {errors.livraison && <p className="text-red-600 text-sm mt-1">{errors.livraison}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix gros (DT) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={form.prix_gros}
                  onChange={(e) => setForm({ ...form, prix_gros: e.target.value })}
                  className={`w-full pl-8 pr-4 py-3 border ${errors.prix_gros ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 transition`}
                />
                <span className="absolute inset-y-0 left-2 pl-3 flex items-center text-gray-500">DT</span>
              </div>
              {errors.prix_gros && <p className="text-red-600 text-sm mt-1">{errors.prix_gros}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock initial <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="0"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={`w-full px-4 py-3 border ${errors.stock ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 transition`}
              />
              {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID externe</label>
              <input
                type="text"
                placeholder="ID externe"
                value={form.id_externe}
                onChange={(e) => setForm({ ...form, id_externe: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === "media" && (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} className="hidden" id="upload-media" />
              <label htmlFor="upload-media" className="cursor-pointer flex flex-col items-center text-teal-500">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V3m0 0l-4 4m4-4 4 4" />
                  </svg>
                </div>
                <span className="text-sm md:text-base font-medium">Glissez-déposez ou cliquez pour ajouter des médias</span>
                <span className="text-xs md:text-sm text-gray-500 mt-2">Images et vidéos acceptées (max 10)</span>
              </label>

              {/* Médias existants */}
              {existingMedias.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Médias existants</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {existingMedias.map((m, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden">
                        {m.type === "video" ? (
                          <video className="w-full h-28 object-contain" controls>
                            <source src={m.url} />
                          </video>
                        ) : (
                          <img src={m.url} alt="Existing media" className="w-full h-28 object-contain" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(i, true)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-700 transition"
                          aria-label="Supprimer le média"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouveaux médias */}
              {previewMedias.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Nouveaux médias</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previewMedias.map((m, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden">
                        {m.type === "image" ? (
                          <img src={m.url} alt="Preview" className="w-full h-28 object-cover" />
                        ) : (
                          <video className="w-full h-28 object-cover" controls>
                            <source src={m.url} />
                          </video>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-700 transition"
                          aria-label="Supprimer le média"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VARIATIONS TAB */}
        {activeTab === "variations" && (
          <div className="md:col-span-2">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="font-medium text-lg mb-4 text-gray-800 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                Variations du produit
              </h3>
              
              {/* Formulaire pour ajouter une nouvelle variation */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Couleur</label>
                  <Select
                    options={colorOptions}
                    value={colorOptions.find(opt => opt.value === newVariation.couleur)}
                    onChange={(selected: any) => setNewVariation({ ...newVariation, couleur: selected.value })}
                    formatOptionLabel={(option: any) => (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: option.color }}
                        ></span>
                        <span>{option.label}</span>
                      </div>
                    )}
                  styles={{
                       control: (base, state) => ({
                         ...base,
                         backgroundColor: "#f9fafb", // gris clair (bg-gray-50)
                         borderColor: state.isFocused ? "#6b7280" : "#d1d5db", // focus: gray-500, sinon gray-300
                         borderRadius: "0.375rem", // rounded-md
                         padding: "2px",
                         boxShadow: state.isFocused ? "0 0 0 1px #6b7280" : "none",
                         "&:hover": {
                           borderColor: "#6b7280",
                         },
                       }),
                       singleValue: (base) => ({
                         ...base,
                         color: "#374151", // text-gray-700
                         fontSize: "0.875rem", // text-sm
                       }),
                       placeholder: (base) => ({
                         ...base,
                         color: "#9ca3af", // text-gray-400
                         fontSize: "0.875rem", // text-sm
                       }),
                       dropdownIndicator: (base) => ({
                         ...base,
                         color: "#6b7280", // icône en gris
                       }),
                     }}
                     placeholder="-- Choisir une couleur --"
                   />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Taille</label>
                  <select
                    value={newVariation.taille}
                    onChange={(e) => setNewVariation({ ...newVariation, taille: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm"
                  >
                    <option value="">-- Choisir une taille --</option>
                    {taillesDisponibles.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prix (DT)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={newVariation.prix_gros}
                    onChange={(e) => setNewVariation({ ...newVariation, prix_gros: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={newVariation.stock}
                    onChange={(e) => setNewVariation({ ...newVariation, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">ID externe</label>
                  <input
                    type="text"
                    placeholder="ID externe"
                    value={newVariation.id_externe}
                    onChange={(e) => setNewVariation({ ...newVariation, id_externe: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 items-center">
               <button type="button" onClick={handleAddVariation} className="px-4 py-2 border border-teal-400 text-teal-400 rounded-lg text-sm">Ajouter une variation</button>
              </div>
              {errors["variation-new"] && (
                <p className="text-red-600 text-xs mt-1">{errors["variation-new"]}</p>
              )}

              {/* Affichage et édition des variations existantes */}
              {form.variations.length > 0 && (
                <div className="mt-6">
                  {errors["variations-sum"] && (
                    <p className="text-red-600 text-sm mt-2">{errors["variations-sum"]}</p>
                  )}
                  <h4 className="text-sm font-medium text-pink-700 mb-3">Variations:</h4>
                  <div className="space-y-4">
                    {form.variations.map((v: any, i: number) => (
                      <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-sm">Variation #{i+1}</span>
                          <button type="button" onClick={() => handleRemoveVariation(i)} className="text-red-500 hover:text-red-700 text-sm">
                            Supprimer
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Couleur
                            </label>
                            <Select
                              value={colorOptions.find((c) => c.value === v.couleur) || null}
                              onChange={(option) => updateVariation(i, "couleur", option?.value || "")}
                              options={colorOptions}
                              placeholder="-- Choisir une couleur --"
                              formatOptionLabel={(option: any) => (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: option.color }}
                                  ></span>
                                  <span>{option.label}</span>
                                </div>
                              )}
                              className="text-sm"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderRadius: "0.375rem", // arrondi Tailwind: rounded-md
                                  borderColor: "#D1D5DB", // gray-300
                                  padding: "2px",
                                }),
                              }}
                            />
                          </div>
                          
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Taille</label>
                            <select
                              value={v.taille}
                              onChange={(e) => updateVariation(i, "taille", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm"
                            >
                              <option value="">-- Choisir une taille --</option>
                              {taillesDisponibles.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Prix (DT)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={v.prix_gros}
                              onChange={(e) => updateVariation(i, "prix_gros", e.target.value)}
                              className={`w-full px-3 py-2 border ${errors[`variation-prix-${i}`] ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm`}
                            />
                            {errors[`variation-prix-${i}`] && (
                              <p className="text-red-600 text-xs mt-1">{errors[`variation-prix-${i}`]}</p>
                            )}
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                            <input
                              type="number"
                              min="0"
                              value={v.stock}
                              onChange={(e) => updateVariation(i, "stock", e.target.value)}
                              className={`w-full px-3 py-2 border ${errors[`variation-stock-${i}`] ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm`}
                            />
                            {errors[`variation-stock-${i}`] && (
                              <p className="text-red-600 text-xs mt-1">{errors[`variation-stock-${i}`]}</p>
                            )}
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">ID externe</label>
                            <input
                              type="text"
                              value={v.id_externe || ""}
                              onChange={(e) => updateVariation(i, "id_externe", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row gap-4 pt-6 border-t border-gray-200">
          <button type="button" onClick={onCancel} className="px-6 py-3 border border-pink-600 text-pink-600 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <div className="flex gap-3 md:ml-auto">
            {activeTab !== "general" && (
              <button type="button" onClick={() => setActiveTab(activeTab === "media" ? "general" : "media")} className="px-6 py-3 text-gray-500 border border-gray-500 rounded-lg">
                {activeTab === "media" ? "Précédent" : "Suivant"}
              </button>
            )}
            <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-teal-400 text-white rounded-lg disabled:opacity-50">
              {isSubmitting ? "En cours..." : (produit ? "Modifier le produit" : "Ajouter le produit")}
            </button>
          </div>
        </div>
      </form>

      {/* Styles spécifiques pour rendre l'éditeur proche de la capture */}
      <style>{`
        /* encadre l'éditeur et ajuste toolbar / zone d'édition */
        .quill-wrapper { background: white; }
        .quill-editor .ql-toolbar { border-bottom: 1px solid #EEF2F7; padding: 6px 8px; }
        .quill-editor .ql-container { min-height: 160px; max-height: 320px; overflow: auto; border: none; padding: 12px 16px; }
        .quill-editor .ql-editor p { margin: 0; }
        /* Make toolbar icons a little larger and more spaced like the capture */
        .quill-editor .ql-toolbar .ql-formats { margin-right: 12px; }
        .quill-editor .ql-toolbar button { padding: 6px; }
      `}</style>
    </div>
  );
}