import React from 'react';
import SignupForm from '../../features/authentication/components/SignupForm';

const SignupPage = () => (
  <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
    <div className="card w-full max-w-4xl">
      <SignupForm />
    </div>
  </div>
);

export default SignupPage;
