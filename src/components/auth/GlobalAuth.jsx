
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';

const GlobalAuth = ({ children }) => {
  const { checkAuth, isAuthenticated, userRole } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuth();
    setAuthChecked(true);
  }, [checkAuth]);

  if (!authChecked) {
    return <div style={{textAlign: 'center', marginTop: '2rem'}}>Loading...</div>;
  }

  return children;
};

export default GlobalAuth;
