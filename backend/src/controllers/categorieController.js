import Categorie from "../models/Categorie.js";

export async function getCategories(req, res) {
  try {
    const categories = await Categorie.findAll();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function createCategorie(req, res) {
  try {
    const { nom, description } = req.body;
    const categorie = await Categorie.create({ nom, description });
    res.status(201).json(categorie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}