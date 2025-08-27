import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/authStore";

const ResetPasswordForm = () => {
  const [formData, setFormData] = useState({
    id_number: "",
    reset_code: "",
    new_password: "",
    confirmPassword: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirmPassword) {
      // Handle password mismatch error
      return;
    }
    
    const resetData = {
      id_number: formData.id_number,
      reset_code: formData.reset_code,
      new_password: formData.new_password
    };
    
    const result = await resetPassword(resetData);
    
    if (result.success) {
      setIsSubmitted(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <img src="/cbrc_logo.png" alt="CBRCS Logo" className="h-16 w-16" />
        </div>
        <div className="bg-success-light text-success-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Password Reset Successful!</h2>
          <p className="mb-4">
            Your password has been successfully reset. You will be redirected to the login page.
          </p>
          <Link
            to="/login"
            className="btn btn-primary inline-block"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-6">
        <img src="/cbrc_logo.png" alt="CBRCS Logo" className="h-16 w-16" />
      </div>
      <h2 className="text-2xl font-bold text-center text-primary-dark mb-6">
        Reset Password
      </h2>
      <p className="text-gray-600 text-center mb-6">
        Enter the 6-digit code sent to your email and your new password.
      </p>
      
      {error && (
        <p className="bg-danger-light text-danger-dark p-3 rounded-md mb-4 text-center">
          {error}
        </p>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          name="id_number"
          placeholder="ID Number"
          value={formData.id_number}
          onChange={handleChange}
          required
          className="form-input mb-4"
        />
        <input
          type="text"
          name="reset_code"
          placeholder="6-Digit Reset Code"
          value={formData.reset_code}
          onChange={handleChange}
          maxLength="6"
          required
          className="form-input mb-4"
        />
        <input
          type="password"
          name="new_password"
          placeholder="New Password"
          value={formData.new_password}
          onChange={handleChange}
          required
          className="form-input mb-4"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm New Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="form-input mb-6"
        />
        <button
          type="submit"
          className="btn btn-primary w-full py-3 mb-4"
          disabled={isLoading || formData.new_password !== formData.confirmPassword}
        >
          {isLoading ? "Resetting Password..." : "Reset Password"}
        </button>
        <div className="text-center">
          <Link
            to="/forgot-password"
            className="text-primary font-semibold hover:underline mr-4"
          >
            Resend Code
          </Link>
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
