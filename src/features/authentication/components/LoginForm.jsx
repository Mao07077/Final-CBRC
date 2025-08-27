import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/authStore";

const LoginForm = () => {
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ idNumber, password });
    
    if (result.success) {
      // Redirect based on user role or survey completion status
      const userData = useAuthStore.getState().userData;
      const isNewUser = useAuthStore.getState().isNewUser;
      
      if (isNewUser && userData.role === 'student') {
        navigate('/survey');
      } else {
        // Redirect to appropriate dashboard based on role
        switch (userData.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'instructor':
            navigate('/instructor/dashboard');
            break;
          case 'student':
            navigate('/student/dashboard');
            break;
          default:
            navigate('/student/dashboard');
        }
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-6">
        <img src="/cbrc_logo.png" alt="CBRCS Logo" className="h-16 w-16" />
      </div>
      <h2 className="text-2xl font-bold text-center text-primary-dark mb-6">
        Welcome Back
      </h2>
      {error && (
        <p className="bg-danger-light text-danger-dark p-3 rounded-md mb-4 text-center">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
                <input
          type="number"
          placeholder="ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="form-input mb-4"
          required
        />
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input pr-10"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.122-6.13m1.415-1.415A9.96 9.96 0 0112 3c5.523 0 10 4.477 10 10a9.96 9.96 0 01-1.293 4.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.835-.642 1.627-1.093 2.357M15.5 15.5l-1.415-1.415M9.5 9.5L8.085 8.085" /></svg>
            )}
          </button>
        </div>
                <button
          type="submit"
          className="btn btn-primary w-full py-3"
          disabled={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
        <div className="flex justify-between items-center mt-6 text-sm">
                    <Link
            to="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot Password?
          </Link>
                    <Link
            to="/signup"
            className="text-primary-dark font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
