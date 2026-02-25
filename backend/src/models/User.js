    import { DataTypes } from "sequelize";
    import sequelize from "../config/database.js";

    const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    telephone: { type: DataTypes.STRING },
    mot_de_passe: { type: DataTypes.STRING, allowNull: false },
    role: { 
        type: DataTypes.ENUM("vendeur", "fournisseur", "admin", "specialiste"), 
        allowNull: false 
    },
    gouvernorat: { type: DataTypes.STRING, allowNull: false },
    ville: { type: DataTypes.STRING, allowNull: false },
    adresse: { type: DataTypes.TEXT, allowNull: false },
    facebook_url: { type: DataTypes.STRING, allowNull: true },
    instagram_url: { type: DataTypes.STRING, allowNull: true },
    actif: { type: DataTypes.BOOLEAN, defaultValue: false },
    validation: { type: DataTypes.BOOLEAN, defaultValue: false },
    image_url: { type: DataTypes.STRING, allowNull: true },
    rib: { type: DataTypes.STRING, allowNull: true },
    refresh_token: { type: DataTypes.STRING, allowNull: true },
    reset_password_token: { type: DataTypes.STRING, allowNull: true },
    reset_password_expires: { type: DataTypes.DATE, allowNull: true },

    }, {
    tableName: "users",
    timestamps: true,
    createdAt: "cree_le",
    updatedAt: "modifie_le",
    });

    export default User;