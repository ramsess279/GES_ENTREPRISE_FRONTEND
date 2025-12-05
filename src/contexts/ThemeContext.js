import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { companyColor, user } = useAuth();
  const [theme, setTheme] = useState('dark'); // Force dark mode by default
  const [primaryColor, setPrimaryColor] = useState('#FF6B35');
  const [secondaryColor, setSecondaryColor] = useState('#6b7280');

  const currentPrimaryColor = companyColor || primaryColor;

  // Clé de stockage basée sur l'utilisateur ou l'entreprise
  const getStorageKey = (key) => {
    const context = user?.entrepriseId || user?.id || 'global';
    return `${key}_${context}`;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem(getStorageKey('theme'));
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedPrimaryColor = localStorage.getItem(getStorageKey('primaryColor'));
    if (savedPrimaryColor) {
      setPrimaryColor(savedPrimaryColor);
    }

    const savedSecondaryColor = localStorage.getItem(getStorageKey('secondaryColor'));
    if (savedSecondaryColor) {
      setSecondaryColor(savedSecondaryColor);
    }
  }, [user?.entrepriseId, user?.id, getStorageKey]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(getStorageKey('theme'), theme);
  }, [theme, user?.entrepriseId, user?.id, getStorageKey]);

  useEffect(() => {
    // Update CSS custom properties for dynamic colors
    document.documentElement.style.setProperty('--color-primary', currentPrimaryColor);
    document.documentElement.style.setProperty('--color-secondary', secondaryColor);
    localStorage.setItem(getStorageKey('primaryColor'), primaryColor);
    localStorage.setItem(getStorageKey('secondaryColor'), secondaryColor);
  }, [currentPrimaryColor, secondaryColor, primaryColor, companyColor, user?.entrepriseId, user?.id, getStorageKey]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const updateColors = (newPrimaryColor, newSecondaryColor) => {
    setPrimaryColor(newPrimaryColor);
    setSecondaryColor(newSecondaryColor);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      primaryColor,
      secondaryColor,
      updateColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};