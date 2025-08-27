import React from 'react';
import LoginForm from '../../features/authentication/components/LoginForm';

const LoginPage = () => (
  <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
    <div className="card w-full max-w-md">
      <LoginForm />
    </div>
  </div>
);

export default LoginPage;
