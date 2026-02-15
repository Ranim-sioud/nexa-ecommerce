import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Select from "react-select";
import {
  Package,
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import api from "../../components/api";

interface Categorie {
  id: number;
  nom: string;
}

// Fonction pour obtenir les styles de couleur
const getCouleurStyle = (couleurNom: string) => {
  const couleursMap: { [key: string]: string } = {
    "Rouge": "#ff0000", "Bleu": "#0000ff", "Vert": "#00ff00", "Noir": "#000000", "Blanc": "#ffffff",
    "Gris": "#808080", "Rose": "#ffc0cb", "Jaune": "#ffff00", "Orange": "#ffa500", "Violet": "#800080",
    "Marron": "#a52a2a", "Beige": "#f5f5dc", "Or": "#ffd700", "Argent": "#c0c0c0", "Turquoise": "#40e0d0",
    "Cyan": "#00ffff", "Magenta": "#ff00ff", "Bordeaux": "#800000", "Bleu ciel": "#87ceeb",
    "Bleu marine": "#000080", "Bleu roi": "#1e00ff", "Bleu clair": "#add8e6", "Bleu foncé": "#00008b",
    "Vert clair": "#90ee90", "Vert foncé": "#006400", "Vert olive": "#808000", "Vert kaki": "#78866b",
    "Vert menthe": "#98ff98", "Vert fluo": "#39ff14", "Jaune clair": "#ffffe0", "Jaune foncé": "#ffcc00",
    "Jaune fluo": "#ccff00", "Orange clair": "#ffb84d", "Orange foncé": "#ff8c00", "Rose clair": "#ffb6c1",
    "Rose foncé": "#ff1493", "Fuchsia": "#ff00ff", "Saumon": "#fa8072", "Corail": "#ff7f50",
    "Lavande": "#e6e6fa", "Lilac": "#c8a2c8", "Mauve": "#e0b0ff", "Chocolat": "#d2691e", "Café": "#4b371c",
    "Camel": "#c19a6b", "Ivoire": "#fffff0", "Crème": "#fffdd0", "Écru": "#f5f5dc", "Anthracite": "#383e42",
    "Ardoise": "#708090", "Charbon": "#242124", "Taupe": "#483c32", "Sable": "#f6d7b0", "Cuivre": "#b87333",
    "Bronze": "#cd7f32"
  };
  return couleursMap[couleurNom] || "#cccccc";
};

export default function SpecialistCreateProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewMedias, setPreviewMedias] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // États du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    livraison: "",
    prix_gros: "",
    stock: "0",
    id_categorie: "",
    id_externe: ""
  });

  const [variations, setVariations] = useState<any[]>([]);
  const [newVariation, setNewVariation] = useState({
    couleur: "",
    taille: "",
    prix_gros: "",
    stock: "",
    id_externe: "",
  });

  // Options de couleurs et tailles
  const couleursDisponibles = [
    "Rouge", "Bleu", "Vert", "Noir", "Blanc", "Gris", "Rose", "Jaune", "Orange", "Violet", 
    "Marron", "Beige", "Or", "Argent", "Turquoise", "Cyan", "Magenta", "Bordeaux", "Bleu ciel", 
    "Bleu marine", "Bleu roi", "Bleu clair", "Bleu foncé", "Vert clair", "Vert foncé", "Vert olive", 
    "Vert kaki", "Vert menthe", "Vert fluo", "Jaune clair", "Jaune foncé", "Jaune fluo", "Orange clair", 
    "Orange foncé", "Rose clair", "Rose foncé", "Fuchsia", "Saumon", "Corail", "Lavande", "Lilac", 
    "Mauve", "Chocolat", "Café", "Camel", "Ivoire", "Crème", "Écru", "Anthracite", "Ardoise", 
    "Charbon", "Taupe", "Sable", "Cuivre", "Bronze"
  ];

  const colorOptions = couleursDisponibles.map((c) => ({
    value: c,
    label: c,
    color: getCouleurStyle(c),
  }));

  const taillesVetements = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
  const taillesChaussures = ["16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48"];
  const taillesEnfants = ["0-3 mois", "3-6 mois", "6-9 mois", "9-12 mois", "12-18 mois", "18-24 mois", "2 ans", "3 ans", "4 ans", "5 ans", "6 ans", "7 ans", "8 ans", "9 ans", "10 ans", "12 ans", "14 ans"];
  const taillesGenerales = ["Petit", "Moyen", "Grand", "Très grand", "Unique", "Taille ajustable", "Standard"];
  const taillesDisponibles = [...taillesVetements, ...taillesChaussures, ...taillesEnfants, ...taillesGenerales];

  // Configuration ReactQuill
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
    "header", "bold", "italic", "underline", "strike", "blockquote", "code-block",
    "list", "bullet", "link", "image", "align", "color", "background",
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Erreur chargement catégories:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nom.trim()) newErrors.nom = "Le nom du produit est requis";
    if (!formData.description.trim()) newErrors.description = "La description est requise";
    if (!formData.livraison.trim()) newErrors.livraison = "Les détails de livraison sont requis";
    if (!formData.prix_gros || parseFloat(formData.prix_gros) < 0) newErrors.prix_gros = "Prix requis et >= 0";
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = "Stock requis et >= 0";
    if (!formData.id_categorie) newErrors.id_categorie = "La catégorie est requise";
    
    // Validation des variations
    if (variations.length > 0) {
      variations.forEach((v, i) => {
        if (!v.prix_gros || parseFloat(v.prix_gros) < 0) {
          newErrors[`variation-prix-${i}`] = "Prix requis et >= 0";
        }
        if (!v.stock || parseInt(v.stock) < 0) {
          newErrors[`variation-stock-${i}`] = "Stock requis et >= 0";
        }
      });

      if (variations.length === 1) {
        const v = variations[0];
        const globalStock = parseInt(formData.stock || "0", 10);
        if (v.stock !== undefined && String(v.stock).trim() !== "") {
          const vStock = parseInt(v.stock, 10);
          if (isNaN(vStock) || vStock !== globalStock) {
            newErrors[`variation-stock-0`] = `Le stock de la seule variation doit être égal au stock global (${globalStock}).`;
          }
        }
      } else if (variations.length > 1) {
        let sommeStock = 0;
        variations.forEach((v, i) => {
          if (v.prix_gros === "" || isNaN(parseFloat(v.prix_gros))) {
            newErrors[`variation-prix-${i}`] = "Prix requis et >= 0";
          }
          if (v.stock === "" || isNaN(parseInt(v.stock))) {
            newErrors[`variation-stock-${i}`] = "Stock requis et >= 0";
          } else {
            sommeStock += parseInt(v.stock, 10);
          }
        });
        if (!newErrors[`variation-stock-0`] && sommeStock !== parseInt(formData.stock || "0", 10)) {
          newErrors["variations-sum"] = `La somme des stocks des variations (${sommeStock}) doit être égale au stock global (${formData.stock}).`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + images.length > 10) {
        alert("Maximum 10 fichiers autorisés");
        return;
      }
      
      setImages(prev => [...prev, ...files]);

      const newPreviews = files.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video") ? "video" : "image",
        file,
      }));
      setPreviewMedias((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const updatedMedias = images.filter((_, i) => i !== index);
    setImages(updatedMedias);
    const updatedPreviews = previewMedias.filter((_, i) => i !== index);
    setPreviewMedias(updatedPreviews);
  };

  const handleVariationChange = (index: number, field: string, value: string) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value
    };
    setVariations(updatedVariations);
  };

  const handleAddVariation = () => {
    const globalStock = parseInt(formData.stock || "0", 10);

    if (variations.length === 0) {
      if (!newVariation.couleur && !newVariation.taille) {
        alert("Pour une seule variation, au moins la couleur ou la taille doit être remplie");
        return;
      }
      
      const stockValue = (newVariation.stock !== undefined && String(newVariation.stock).trim() !== "")
        ? parseInt(newVariation.stock, 10)
        : globalStock;
        
      const variationToAdd = {
        ...newVariation,
        prix_gros: newVariation.prix_gros ? parseFloat(newVariation.prix_gros) : "",
        stock: stockValue,
      };
      setVariations([variationToAdd]);
    } else {
      if (!newVariation.couleur || !newVariation.taille || newVariation.prix_gros === "" || newVariation.stock === "") {
        alert("Toutes les propriétés sont obligatoires lorsque plusieurs variations sont ajoutées");
        return;
      }
      
      const variationToAdd = {
        ...newVariation,
        prix_gros: parseFloat(newVariation.prix_gros),
        stock: parseInt(newVariation.stock, 10),
      };
      setVariations([...variations, variationToAdd]);
    }
    
    setNewVariation({ couleur: "", taille: "", prix_gros: "", stock: "", id_externe: "" });
  };

  const removeVariation = (index: number) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    
    setSaving(true);

    try {
      // Créer FormData
      const submitData = new FormData();
      submitData.append('nom', formData.nom);
      submitData.append('description', formData.description);
      submitData.append('livraison', formData.livraison);
      submitData.append('prix_gros', formData.prix_gros);
      submitData.append('stock', formData.stock);
      submitData.append('id_categorie', formData.id_categorie);
      submitData.append('id_externe', formData.id_externe);
      
      // Ajouter les variations
      if (variations.length > 0) {
        submitData.append('variations', JSON.stringify(variations));
      }

      // Ajouter les images
      images.forEach(file => {
        submitData.append('medias', file);
      });

      console.log("Création du produit...");
      
      const response = await api.post(
        "/specialist/products", 
        submitData
      );

      console.log("Produit créé:", response.data);
      alert("Produit créé avec succès");
      navigate("/specialist/products");
      
    } catch (error: any) {
      console.error("Erreur création produit:", error);
      
      if (error.response?.data) {
        console.error("Détails erreur:", error.response.data);
        alert(`Erreur: ${error.response.data.message || "Erreur serveur"}`);
      } else {
        alert("Erreur lors de la création du produit");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/specialist/products")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-teal-500" />
              Nouveau Produit
            </h2>
            <p className="text-gray-600 mt-1">Créez un nouveau produit en tant qu'administrateur</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={saving || !formData.nom || !formData.prix_gros}
          className="bg-teal-500 hover:bg-teal-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Création..." : "Créer le produit"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-3 pt-4 text-sm font-medium ${activeTab === "general" ? "text-teal-500 border-b-2 border-teal-400" : "text-gray-500 hover:text-gray-700"}`}
          >
            Informations générales
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`pb-3 pt-4 text-sm font-medium ${activeTab === "media" ? "text-teal-500 border-b-2 border-teal-400" : "text-gray-500 hover:text-gray-700"}`}
          >
            Médias
          </button>
          <button
            onClick={() => setActiveTab("variations")}
            className={`pb-3 pt-4 text-sm font-medium ${activeTab === "variations" ? "text-teal-500 border-b-2 border-teal-400" : "text-gray-500 hover:text-gray-700"}`}
          >
            Variations
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Informations de base */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Informations du produit</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du produit *
                      </label>
                      <Input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                        placeholder="Nom du produit"
                        className={errors.nom ? "border-red-500" : ""}
                      />
                      {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <ReactQuill
                          theme="snow"
                          value={formData.description}
                          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                          modules={quillModules}
                          formats={quillFormats}
                          className="bg-white"
                        />
                      </div>
                      {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Détails de livraison *
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <ReactQuill
                          theme="snow"
                          value={formData.livraison}
                          onChange={(value) => setFormData(prev => ({ ...prev, livraison: value }))}
                          modules={quillModules}
                          formats={quillFormats}
                          className="bg-white"
                        />
                      </div>
                      {errors.livraison && <p className="text-red-600 text-sm mt-1">{errors.livraison}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prix gros (TND) *
                        </label>
                        <Input
                          type="number"
                          name="prix_gros"
                          value={formData.prix_gros}
                          onChange={handleInputChange}
                          required
                          step="0.01"
                          min="0"
                          className={errors.prix_gros ? "border-red-500" : ""}
                        />
                        {errors.prix_gros && <p className="text-red-600 text-sm mt-1">{errors.prix_gros}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock *
                        </label>
                        <Input
                          type="number"
                          name="stock"
                          value={formData.stock}
                          onChange={handleInputChange}
                          required
                          min="0"
                          className={errors.stock ? "border-red-500" : ""}
                        />
                        {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Catégorie *
                        </label>
                        <select
                          name="id_categorie"
                          value={formData.id_categorie}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border ${errors.id_categorie ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400`}
                        >
                          <option value="">Sélectionner une catégorie</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nom}
                            </option>
                          ))}
                        </select>
                        {errors.id_categorie && <p className="text-red-600 text-sm mt-1">{errors.id_categorie}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Externe
                        </label>
                        <Input
                          type="text"
                          name="id_externe"
                          value={formData.id_externe}
                          onChange={handleInputChange}
                          placeholder="ID externe (optionnel)"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Informations */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Informations</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        Nouveau
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Créé par:</span>
                      <span className="font-medium">Spécialiste</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Associé à:</span>
                      <span className="font-medium">Administrateur</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === "media" && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Images du produit</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  id="upload-media" 
                />
                <label htmlFor="upload-media" className="cursor-pointer flex flex-col items-center text-teal-500">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-teal-400" />
                  </div>
                  <span className="text-sm md:text-base font-medium">Glissez-déposez ou cliquez pour ajouter des médias</span>
                  <span className="text-xs md:text-sm text-gray-500 mt-2">Images et vidéos acceptées (max 10)</span>
                </label>

                {/* Aperçu des médias */}
                {previewMedias.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Médias sélectionnés</h3>
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
                          <Button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-700 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* VARIATIONS TAB */}
        {activeTab === "variations" && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Variations du produit</h3>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                {/* Formulaire pour ajouter une nouvelle variation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Couleur</label>
                    <Select
                      options={colorOptions}
                      value={colorOptions.find(opt => opt.value === newVariation.couleur)}
                      onChange={(selected: any) => setNewVariation({ ...newVariation, couleur: selected?.value || "" })}
                      formatOptionLabel={(option: any) => (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: option.color }}
                          ></span>
                          <span>{option.label}</span>
                        </div>
                      )}
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
                
                <Button type="button" onClick={handleAddVariation} variant="outline" className="border-teal-400 text-teal-400">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une variation
                </Button>
              </div>

              {/* Affichage des variations existantes */}
              {variations.length > 0 && (
                <div>
                  {errors["variations-sum"] && (
                    <p className="text-red-600 text-sm mt-2 mb-4">{errors["variations-sum"]}</p>
                  )}
                  
                  <div className="space-y-4">
                    {variations.map((v, i) => (
                      <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-sm">Variation #{i+1}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeVariation(i)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Couleur</label>
                            <Select
                              value={colorOptions.find((c) => c.value === v.couleur) || null}
                              onChange={(option) => handleVariationChange(i, "couleur", option?.value || "")}
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
                            />
                          </div>
                          
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Taille</label>
                            <select
                              value={v.taille}
                              onChange={(e) => handleVariationChange(i, "taille", e.target.value)}
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
                              onChange={(e) => handleVariationChange(i, "prix_gros", e.target.value)}
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
                              onChange={(e) => handleVariationChange(i, "stock", e.target.value)}
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
                              onChange={(e) => handleVariationChange(i, "id_externe", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition duration-200 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {variations.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  Aucune variation définie. Le produit aura une seule variation par défaut.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation entre les tabs */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          {activeTab !== "general" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab(activeTab === "media" ? "general" : "media")}
            >
              {activeTab === "media" ? "← Informations générales" : "← Médias"}
            </Button>
          )}
          
          {activeTab !== "variations" && (
            <Button
              type="button"
              onClick={() => setActiveTab(activeTab === "general" ? "media" : "variations")}
              className="ml-auto"
            >
              {activeTab === "general" ? "Médias →" : "Variations →"}
            </Button>
          )}
        </div>
      </form>

      {/* Styles pour ReactQuill */}
      <style>{`
        .ql-toolbar { border-bottom: 1px solid #e5e7eb; }
        .ql-container { border: none !important; min-height: 120px; }
        .ql-editor { font-size: 14px; }
      `}</style>
    </div>
  );
};