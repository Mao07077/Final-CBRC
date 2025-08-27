import { create } from 'zustand';
import authService from '../services/authService';

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  userRole: null,
  userData: null,
  isNewUser: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      const userData = response.data;
      
      if (userData.success) {
        // Store user data
        const userInfo = {
          id_number: userData.id_number,
          role: userData.role,
          program: userData.program,
          firstname: userData.firstname,
          lastname: userData.lastname,
          hoursActivity: userData.hoursActivity,
          surveyCompleted: userData.surveyCompleted,
          profileImageUrl: userData.profileImageUrl || ""
        };

        // Store in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userData', JSON.stringify(userInfo));
        localStorage.setItem('isNewUser', (!userData.surveyCompleted).toString());

        set({ 
          isAuthenticated: true, 
          userRole: userData.role, 
          userData: userInfo,
          isNewUser: !userData.surveyCompleted,
          isLoading: false 
        });
        
        return { success: true };
      } else {
        set({ error: 'Invalid credentials', isLoading: false });
        return { success: false, message: 'Invalid credentials' };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup(userData);
      const result = response.data;
      
      if (result.success) {
        // After successful signup, automatically log in
        const loginResult = await get().login({
          idNumber: userData.id_number,
          password: userData.password
        });
        
        return loginResult;
      } else {
        set({ error: result.message, isLoading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Signup failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('isNewUser');
    localStorage.removeItem('token');
    set({ 
      isAuthenticated: false, 
      userRole: null, 
      userData: null, 
      isNewUser: false 
    });
  },

  checkAuth: () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');
    const userData = localStorage.getItem('userData');
    const isNewUser = localStorage.getItem('isNewUser') === 'true';
    
    if (isAuthenticated && userRole && userData) {
      set({ 
        isAuthenticated: true, 
        userRole, 
        userData: JSON.parse(userData),
        isNewUser 
      });
    }
  },
  
  completeSurvey: () => {
    localStorage.setItem('isNewUser', 'false');
    set({ isNewUser: false });
  },

  // Password reset functions
  forgotPassword: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.sendResetCode(data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to send reset code';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  resetPassword: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.resetPassword(data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to reset password';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  }
}));

export default useAuthStore;
