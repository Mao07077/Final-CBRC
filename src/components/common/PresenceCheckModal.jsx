import React from 'react';

// Generic modal asking user to confirm presence. Timer pauses externally while open.
const PresenceCheckModal = ({ isOpen, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 text-center">Are you still there?</h2>
        <p className="text-sm text-gray-600 text-center">We paused your session timer. Click the button below to continue.</p>
        <button
          onClick={onConfirm}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Yes, I'm here
        </button>
      </div>
    </div>
  );
};

export default PresenceCheckModal;
