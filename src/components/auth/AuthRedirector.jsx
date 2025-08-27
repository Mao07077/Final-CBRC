import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const AuthRedirector = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isNewUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'student' && isNewUser) {
        navigate('/survey');
      } else if (userRole === 'student') {
        navigate('/student/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'instructor') {
        navigate('/instructor/dashboard');
      }
    }
  }, [isAuthenticated, userRole, isNewUser, navigate]);

  return null;
};

export default AuthRedirector;
