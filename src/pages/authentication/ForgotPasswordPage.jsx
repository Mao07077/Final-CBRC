import React from "react";
import ForgotPasswordForm from "../../features/authentication/components/ForgotPasswordForm";

const ForgotPasswordPage = () => (
  <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
    <div className="container max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
      <ForgotPasswordForm />
    </div>
  </div>
);

export default ForgotPasswordPage;
