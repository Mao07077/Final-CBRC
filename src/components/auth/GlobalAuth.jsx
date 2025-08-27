import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';

const GlobalAuth = ({ children }) => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return children;
};

export default GlobalAuth;
