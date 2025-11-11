import React from 'react';
import { Link } from 'react-router-dom';

// Per request: Remove Sign Up and center the 'Forgot Password?' link
const SignupPage = () => (
  <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
    <div className="w-full max-w-md text-center">
      <img src="/cbrc_logo.png" alt="CBRCS Logo" className="h-16 w-auto max-w-[200px] object-contain mx-auto mb-6" />
      <h1 className="text-xl font-semibold mb-3">Account Recovery</h1>
      <p className="text-gray-600 mb-6">Need help accessing your account?</p>
      <Link
        to="/forgot-password"
        className="inline-block text-primary hover:underline text-base"
      >
        Forgot Password?
      </Link>
    </div>
  </div>
);

export default SignupPage;
