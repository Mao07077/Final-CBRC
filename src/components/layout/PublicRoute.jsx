import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, userRole, isNewUser } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    // Allow new students to access the survey page
    if (userRole === 'student' && isNewUser && location.pathname === '/survey') {
      return children;
    }

    // Redirect authenticated users from public pages to their respective dashboards
    // or force new students to the survey page if they try to navigate elsewhere.
    let dashboardPath = '/';
    if (userRole === 'student') {
      dashboardPath = isNewUser ? '/survey' : '/student/dashboard';
    } else if (userRole === 'admin') {
      dashboardPath = '/admin/dashboard';
    } else if (userRole === 'instructor') {
      dashboardPath = '/instructor/dashboard';
    }
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default PublicRoute;
