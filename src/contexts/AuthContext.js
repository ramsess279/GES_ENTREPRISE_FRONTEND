import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyColor, setCompanyColor] = useState(null);

  // Check for stored token on app start
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Décoder le token pour récupérer les données à jour (incluant originalRole)
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userData = JSON.parse(storedUser);

        // Fusionner les données du token avec celles stockées localement
        const mergedUser = {
          ...userData,
          ...decoded,
          // Conserver originalRole du token
          originalRole: decoded.originalRole
        };

        setUser(mergedUser);
        // Mettre à jour le localStorage avec les données fusionnées
        localStorage.setItem('user', JSON.stringify(mergedUser));
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        setUser(JSON.parse(storedUser));
      }
    }

    setLoading(false);
  }, []);

  // Load company color for users with entrepriseId
  useEffect(() => {
    const loadCompanyColor = async () => {
      if (user?.entrepriseId) {
        try {
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3010/api';
          const response = await fetch(`${baseUrl}/entreprises/${user.entrepriseId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const color = data.couleurPrimaire || '#0ea5e9';
            setCompanyColor(color);
          }
        } catch (error) {
        }
      } else {
        setCompanyColor(null);
      }
    };

    if (user) {
      loadCompanyColor();
    }
  }, [user]);

  // Apply company color to CSS variable
  useEffect(() => {
    if (companyColor) {
      document.documentElement.style.setProperty('--color-primary', companyColor);
    } else {
      // Reset to default if no company color
      document.documentElement.style.setProperty('--color-primary', '#FF6B35');
      document.documentElement.style.setProperty('--color-secondary', '#6b7280');
    }
  }, [companyColor]);

  const login = async (email, motDePasse) => {
    try {
      const response = await authAPI.login(email, motDePasse);
      const { token, user } = response.data;

      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, utilisateur } = response.data;

      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(utilisateur));

      setUser(utilisateur);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur d\'inscription'
      };
    }
  };

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const switchCompany = async (entrepriseId) => {
    try {
      const response = await authAPI.switchCompany(entrepriseId);
      const { token, entreprise } = response.data;

      // Mettre à jour le token
      localStorage.setItem('authToken', token);

      // Mettre à jour l'utilisateur avec les nouvelles données du token
      const updatedUser = { ...user, entrepriseId: entrepriseId };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Mettre à jour la couleur de l'entreprise
      setCompanyColor(entreprise ? entreprise.couleurPrimaire : null);

      return { success: true, entreprise };
    } catch (error) {
      console.error('Switch company error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du changement d\'entreprise'
      };
    }
  };

  const switchBackToSuperAdmin = async () => {
    try {
      const response = await authAPI.switchCompany(null);
      const { token } = response.data;

      // Mettre à jour le token
      localStorage.setItem('authToken', token);

      // Mettre à jour l'utilisateur avec entrepriseId à null et rôle restauré
      const updatedUser = { ...user, entrepriseId: null, role: 'super-admin', originalRole: undefined };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Réinitialiser la couleur de l'entreprise
      setCompanyColor(null);

      return { success: true };
    } catch (error) {
      console.error('Switch back to super-admin error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du retour au mode super-admin'
      };
    }
  };

  // Logique de comportement : si super-admin avec entrepriseId, se comporter comme admin
  const effectiveRole = (user?.role === 'super-admin' && user?.entrepriseId) ? 'admin' : user?.role;

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    switchCompany,
    switchBackToSuperAdmin,
    companyColor,
    updateCompanyColor: setCompanyColor,
    isAuthenticated: !!user,
    isSuperAdmin: effectiveRole === 'super-admin',
    isAdmin: effectiveRole === 'admin',
    isVigile: effectiveRole === 'vigile',
    isCaissier: effectiveRole === 'caissier',
    isSuperAdminInCompanyMode: user?.role === 'super-admin' && user?.entrepriseId !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};