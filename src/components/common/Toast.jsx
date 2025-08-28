import React, { useEffect } from "react";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      background: "#38a169",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      zIndex: 9999,
      fontWeight: "bold"
    }}>
      {message}
    </div>
  );
};

export default Toast;
