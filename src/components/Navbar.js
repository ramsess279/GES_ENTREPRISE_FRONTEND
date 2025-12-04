import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { companiesAPI } from '../utils/api';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Button from './ui/Button';

const Navbar = () => {
  const { user, logout, isSuperAdminInCompanyMode, switchBackToSuperAdmin, isAdmin, companyColor } = useAuth();
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfo] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (isAdmin && user?.entrepriseId) {
        try {
          const response = await companiesAPI.getById(user.entrepriseId);
          setCompanyInfo(response.data);
        } catch (error) {
          console.error('Erreur lors du chargement des infos entreprise:', error);
        }
      } else {
        setCompanyInfo(null);
      }
    };

    fetchCompanyInfo();
  }, [isAdmin, user?.entrepriseId]);

  const handleSwitchBack = async () => {
    try {
      const result = await switchBackToSuperAdmin();
      if (result.success) {
        // Rediriger vers le dashboard super-admin
        navigate('/dashboard');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors du retour au mode super-admin:', error);
      alert('Erreur lors du retour au mode super-admin');
    }
  };


  return (
    <nav
      className="fixed top-0 left-0 right-0 z-20 bg-white dark:bg-secondary-800 shadow-sm border-b border-secondary-200 dark:border-secondary-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              {companyInfo ? (
                <>
                  {companyInfo.logoUrl && (
                    <img
                      src={companyInfo.logoUrl.startsWith('http') ? companyInfo.logoUrl : `${(process.env.REACT_APP_API_URL || 'http://localhost:3010/api').replace('/api', '')}${companyInfo.logoUrl}`}
                      alt={`Logo ${companyInfo.nom}`}
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <span className="text-xl font-bold text-primary-600">
                    {companyInfo.nom}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-primary-600">
                  Gestion Salaires
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center space-x-4">


            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {user?.nomComplet}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                    {user?.role?.replace('-', ' ')}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

    </nav>
  );
};

export default Navbar;