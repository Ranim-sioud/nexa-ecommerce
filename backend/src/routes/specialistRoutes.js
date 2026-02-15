import express from "express";
import { 
  getDashboard,
  manageUsers,
  manageProducts,
  updateUserStatusSpecialist,
  getMyTasks,
  updateMyTaskStatus,  // AJOUTEZ CETTE IMPORTATION
  updateProductSpecialist,
  deleteProductSpecialist,
  getProductByIdSpecialist,
  createProductSpecialist
} from "../controllers/specialistController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { getProduitById } from "../controllers/produitController.js";
import { upload } from "../middlewares/uploadCloudinary.js";
import { deleteUser, updateUserStatus } from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth);

// Tableau de bord
router.get("/dashboard", getDashboard);

// Gestion des utilisateurs (avec permissions)
router.get("/users",requirePermission('users', 'view'), manageUsers);
router.patch("/users/:id/status", requirePermission('users', 'manage'), updateUserStatus);
router.delete("/users/:id", requirePermission('products', 'delete'), deleteUser);

// Gestion des produits (avec permissions)  
router.get("/products", requirePermission('products', 'view'), manageProducts);

router.get("/products/:id", requirePermission('products', 'view'), getProduitById);
router.post("/products", requirePermission('products', 'manage'), upload.array("medias", 8), createProductSpecialist);
router.patch("/products/:id", requirePermission('products', 'edit'),upload.array("medias", 8), updateProductSpecialist); // AJOUT
router.delete("/products/:id", requirePermission('products', 'delete'), deleteProductSpecialist); // AJOUT
router.get("/products/:id", requirePermission('products', 'view'), getProductByIdSpecialist);

// AJOUTEZ CES ROUTES POUR LES TÂCHES
router.get("/tasks", getMyTasks);
router.patch("/tasks/:id/status", updateMyTaskStatus);

export default router;