import { DataTypes } from 'sequelize';
import sequelize from "../config/database.js";
const Pack = sequelize.define('Pack', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cle: { type: DataTypes.STRING(50), unique: true },
    titre: DataTypes.STRING(150),
    prix: DataTypes.DECIMAL(10,2),
    description: DataTypes.TEXT
  }, { tableName: 'packs', timestamps: false });
  
export default Pack;

/* 
-- Mise à jour du pack Free -> Origin
UPDATE packs 
SET cle = 'origin', 
    titre = 'Origin', 
    prix = 0.00, 
    description = 'Pack Origin'
WHERE cle = 'free' OR titre = 'Free';

-- Mise à jour du pack Damrej -> Elevation (prix: 297.00 -> 490.00)
UPDATE packs 
SET cle = 'elevation', 
    titre = 'Elevation', 
    prix = 490.00, 
    description = 'Pack Elevation'
WHERE cle = 'damrej' OR titre = 'Damrej';

-- Mise à jour du pack 3jeja -> Prestige (prix: 497.00 -> 970.00)
UPDATE packs 
SET cle = 'prestige', 
    titre = 'Prestige', 
    prix = 970.00, 
    description = 'Pack Prestige'
WHERE cle = '3jeja' OR titre = '3jeja';

-- Mise à jour du pack Brand -> Legacy (prix: 1997.00 -> 1290.00)
UPDATE packs 
SET cle = 'legacy', 
    titre = 'Legacy', 
    prix = 1290.00, 
    description = 'Pack Legacy'
WHERE cle = 'brand' OR titre = 'Brand';
*/

/* DELETE FROM packs 
WHERE cle = 'machrou3' OR titre = 'Machrou3'; */