import React from "react";
import { motion } from "framer-motion";

interface PopupAlerteStockProps {
  message: string;
  onClose: () => void;
}

const PopupAlerteStock: React.FC<PopupAlerteStockProps> = ({ message, onClose }) => {
  return (
    <div className="popup-overlay">
      <motion.div
        className="popup-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="popup-title">⚠️ Stock insuffisant</h3>
        <p className="popup-message">{message}</p>
        <button className="popup-btn" onClick={onClose}>
          Fermer
        </button>
      </motion.div>
    </div>
  );
};

export default PopupAlerteStock;