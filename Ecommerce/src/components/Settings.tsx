import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Eye, EyeOff,Copy } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import api from "./api";

export default function Settings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [userInfo, setUserInfo] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    governorate: "",
    city: "",
    address: "",
    bankAccount: "",
    nom_boutique: "",
    profileImage: "",
    codeParrainage: "",  // 🔹 code
    lienParrainage: "",
    pack_cle: "",
    pack_demande: "",
    statut_demande_pack: "aucune",
    
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState("");

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/me");    
      const userData = {
        id: res.data.id,
        name: res.data.nom,
        email: res.data.email,
        phone: res.data.telephone || "",
        role: res.data.role || "",
        governorate: res.data.gouvernorat || "",
        city: res.data.ville || "",
        address: res.data.adresse || "",
        bankAccount: res.data.rib || "",
        nom_boutique: res.data.nom_boutique || "",
        profileImage: res.data.image_url || "",
        codeParrainage: res.data.code_parrainage || "",
        lienParrainage: `http://localhost:3000/auth/signup?code=${res.data.code_parrainage || ""}`,
        pack_cle: res.data.pack_cle || "",
        pack_demande: res.data.pack_demande || "",
        statut_demande_pack: res.data.statut_demande_pack || "aucune",
      };    
      setUserInfo(userData);
      setSelectedPack(userData.pack_demande || userData.pack_cle || "");    
    } catch (err) {
      toast.error("Impossible de charger votre profil ❌");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);


  useEffect(() => {
    fetchPacks();
  }, []);
  
  const fetchPacks = async () => {
    try {
      const res = await api.get("/packs");
      setPacks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (field, value) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas ❌");
      return;
    }

    try {
      await api.put(
       "/users/me",
       {
          nom: userInfo.name,
          email: userInfo.email,
          telephone: userInfo.phone,
          gouvernorat: userInfo.governorate,
          ville: userInfo.city,
          adresse: userInfo.address,
          rib: userInfo.bankAccount,
          nom_boutique: userInfo.nom_boutique,
          mot_de_passe: passwordData.newPassword || undefined,
          profileImage: userInfo.profileImage || undefined,
        }
      );

      toast.success("Profil mis à jour avec succès ✅");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour ❌");
    }
  };

  const handleDemandePack = async () => {
  try {
    await api.post("/users/demander", {
      nouveau_pack: selectedPack
    });

    toast.success("Demande mise à jour ✅");

    await fetchUser(); // 🔥 rafraîchit automatiquement

  } catch (err) {
    toast.error(err.response?.data?.message);
  }
};

const handleAnnulerDemande = async () => {
  try {
    await api.post("/users/annuler-demande");

    toast.success("Demande annulée ✅");

    await fetchUser(); // 🔥 rafraîchit

  } catch (err) {
    toast.error(err.response?.data?.message);
  }
};

  const handleChangeImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement; // cast
    const file = target.files?.[0];
    if (!file) return;
      try {
        const formData = new FormData();
        formData.append("profileImage", file);

        await api.post("/users/me/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
  
        const meRes = await api.get("/users/me");

        setUserInfo((prev) => {
          const updated = { ...prev, profileImage: meRes.data.image_url };
          localStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });

        toast.success("Image de profil mise à jour ✅");
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors du téléchargement de l’image ❌");
      }
    };
    input.click();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier ✅");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Paramètres</h1>
      </div>

      {/* Profil utilisateur */}
      <Card className="rounded-xl shadow-md border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4 mb-8">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userInfo.profileImage} />
              <AvatarFallback className="text-2xl bg-gray-100">
                <User className="h-12 w-12 text-gray-400" />
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h2 className="text-xl font-semibold">{userInfo.name}</h2>
              <Button variant="outline" size="sm" onClick={handleChangeImage} className="mt-2">
                Changer l'image
              </Button>
            </div>
          </div>

          {/* Formulaire infos utilisateur */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Informations Utilisateur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom */}
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={userInfo.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={userInfo.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={userInfo.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              {/* Gouvernorat (liste déroulante) */}
              <div className="space-y-2">
                <Label>Gouvernorat</Label>
                <select
                  value={userInfo.governorate}
                  onChange={(e) => handleInputChange("governorate", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2"
                >
                  <option value="">-- Sélectionnez un gouvernorat --</option>
                  <option value="Tunis">Tunis</option>
                  <option value="Ariana">Ariana</option>
                  <option value="Ben Arous">Ben Arous</option>
                  <option value="Manouba">Manouba</option>
                  <option value="Nabeul">Nabeul</option>
                  <option value="Zaghouan">Zaghouan</option>
                  <option value="Bizerte">Bizerte</option>
                  <option value="Béja">Béja</option>
                  <option value="Jendouba">Jendouba</option>
                  <option value="Kef">Kef</option>
                  <option value="Siliana">Siliana</option>
                  <option value="Sousse">Sousse</option>
                  <option value="Monastir">Monastir</option>
                  <option value="Mahdia">Mahdia</option>
                  <option value="Sfax">Sfax</option>
                  <option value="Kairouan">Kairouan</option>
                  <option value="Kasserine">Kasserine</option>
                  <option value="Sidi Bouzid">Sidi Bouzid</option>
                  <option value="Gabès">Gabès</option>
                  <option value="Medenine">Medenine</option>
                  <option value="Tataouine">Tataouine</option>
                  <option value="Gafsa">Gafsa</option>
                  <option value="Tozeur">Tozeur</option>
                  <option value="Kebili">Kebili</option>
                </select>
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={userInfo.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={userInfo.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>

              {/* RIB */}
              <div className="space-y-2">
                <Label>RIB</Label>
                <Input
                  value={userInfo.bankAccount}
                  onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                />
              </div>

              {/* Boutique */}
              {userInfo.role === "vendeur" &&(
              <div className="space-y-2">
                <Label>Boutique</Label>
                <Input
                  value={userInfo.nom_boutique}
                  onChange={(e) => handleInputChange("nom_boutique", e.target.value)}
                />
              </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🔹 Nouvelle carte pour le parrainage */}
      {userInfo.role === "vendeur" && (userInfo.codeParrainage || userInfo.lienParrainage) && (
        <Card className="rounded-xl shadow-md border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-6">Parrainage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
            {userInfo.codeParrainage && (
              <div className="mb-4 space-y-2">
                <Label>Votre code de parrainage</Label>
                <div className="flex items-center space-x-2">
                  <Input value={userInfo.codeParrainage} readOnly />
                  <Button size="sm" onClick={() => handleCopy(userInfo.codeParrainage)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
      
            {userInfo.lienParrainage && (
              <div className="mb-4 space-y-2">
                <Label>Votre lien de parrainage</Label>
                <div className="flex items-center space-x-2">
                  <Input value={userInfo.lienParrainage} readOnly />
                  <Button size="sm" onClick={() => handleCopy(userInfo.lienParrainage)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section mot de passe */}
      <Card className="rounded-xl shadow-md border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-6">Changer le mot de passe</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "currentPassword",
                label: "Mot de passe actuel",
                state: showCurrentPassword,
                setState: setShowCurrentPassword,
                value: passwordData.currentPassword,
              },
              {
                id: "newPassword",
                label: "Nouveau mot de passe",
                state: showNewPassword,
                setState: setShowNewPassword,
                value: passwordData.newPassword,
              },
              {
                id: "confirmPassword",
                label: "Confirmer",
                state: showConfirmPassword,
                setState: setShowConfirmPassword,
                value: passwordData.confirmPassword,
              },
            ].map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <div className="relative">
                  <Input
                    id={field.id}
                    type={field.state ? "text" : "password"}
                    value={field.value}
                    onChange={(e) => handlePasswordChange(field.id, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => field.setState(!field.state)}
                  >
                    {field.state ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {userInfo.role === "vendeur" && (
        <Card className="rounded-xl shadow-md border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pack actuel</h3>
            <Input value={userInfo.pack_cle} readOnly />
          </CardContent>
        </Card>
      )}
      {userInfo.role === "vendeur" && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Changer de pack
            </h3>
      
            <select
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">Choisir un pack</option>
      
              {packs.map((pack) => (
                <option key={pack.id} value={pack.cle}>
                  {pack.titre} - {pack.prix}dt
                </option>
              ))}
      
            </select>
      
            <Button
              className="mt-4"
              onClick={handleDemandePack}
              disabled={!selectedPack}
            >
              {userInfo.statut_demande_pack === "en_attente"
                ? "Modifier la demande"
                : "Envoyer la demande"}
            </Button>
            <Button
                variant="destructive"
                className="ml-4"
                onClick={handleAnnulerDemande}
              >
                Annuler la demande
              </Button>
      
            {userInfo.statut_demande_pack === "en_attente" && (
              <p className="text-pink-600 mt-2">
                Demande en attente de validation ⏳
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-2 rounded-lg shadow-md"
        >
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}