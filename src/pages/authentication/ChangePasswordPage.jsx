import React from 'react';
import ChangePasswordForm from '../../features/authentication/components/ChangePasswordForm';

const ChangePasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Change Your Password</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">For security, please set a new password before continuing.</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
};

export default ChangePasswordPage;
