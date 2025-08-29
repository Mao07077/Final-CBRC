import React, { useState } from "react";
import ProfileUpdateRequestForm from "../../components/ProfileUpdateRequestForm";

const ProfileUpdateRequestModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          &times;
        </button>
        <ProfileUpdateRequestForm />
      </div>
    </div>
  );
};

export default ProfileUpdateRequestModal;
