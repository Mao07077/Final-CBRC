import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../../store/authStore";

const ForgotPasswordForm = () => {
  const { forgotPassword, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    id_number: "",
    email: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await forgotPassword(formData);
    
    if (result.success) {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full text-center">
        <h2 className="text-2xl font-bold text-primary-dark mb-4">
          Reset Code Sent!
        </h2>
        <p className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
          A 6-digit reset code has been sent to your email address.
        </p>
        <Link
          to="/reset-password"
          className="btn btn-primary inline-block"
        >
          Enter Reset Code
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold text-primary-dark mb-4">
        Forgot Password
      </h2>
      <p className="text-gray-600 mb-6">
        Enter your ID and email to receive a reset code.
      </p>
      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          name="id_number"
          placeholder="ID Number"
          value={formData.id_number}
          onChange={handleChange}
          className="w-full px-4 py-3 mb-4 border rounded-lg"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 mb-4 border rounded-lg"
          required
        />
        <button
          type="submit"
          className="w-full bg-primary-dark text-white py-3 rounded-lg font-semibold hover:bg-accent-medium transition disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Code"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        <Link to="/login" className="text-accent-medium hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;
