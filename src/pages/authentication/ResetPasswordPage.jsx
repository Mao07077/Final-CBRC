import React from "react";
import ResetPasswordForm from "../../features/authentication/components/ResetPasswordForm";

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent-light flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
