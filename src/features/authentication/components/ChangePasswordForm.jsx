import React, { useState } from 'react';
import useAuthStore from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';

const ChangePasswordForm = () => {
  const navigate = useNavigate();
  const { firstPasswordChange, userData, isLoading, error, logout } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!userData) {
    return <div className="text-center text-gray-600">No user context.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (newPassword.length < 8) {
      setLocalError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    const result = await firstPasswordChange({
      id_number: userData.id_number,
      old_password: oldPassword,
      new_password: newPassword
    });
    if (result.success) {
      setShowSuccessModal(true);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || localError) && (
        <div className="bg-danger-light text-danger-dark p-3 rounded text-sm">
          {localError || error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Current Password</label>
        <div className="relative">
          <input
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="form-input w-full pr-10"
            required
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowOld(s => !s)}>
            {showOld ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="form-input w-full pr-10"
            required
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowNew(s => !s)}>
            {showNew ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input w-full pr-10"
            required
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowConfirm(s => !s)}>
            {showConfirm ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full py-3"
      >
        {isLoading ? 'Updating...' : 'Save New Password'}
      </button>
    </form>
    {showSuccessModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Password updated</h2>
          <p className="text-gray-700">Please log in again with your new password to continue.</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => { setShowSuccessModal(false); logout(); navigate('/login', { state: { msg: 'Password updated. Please log in with your new password.' } }); }}
              className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ChangePasswordForm;
