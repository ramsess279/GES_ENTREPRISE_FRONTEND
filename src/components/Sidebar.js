import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const Sidebar = () => {
  const { logout, user, isSuperAdmin, isAdmin, isCaissier, isSuperAdminInCompanyMode, switchBackToSuperAdmin } = useAuth();
  const isVigile = user?.role === 'vigile';
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  const getMenuItems = () => {
    const baseItems = [
      {
        name: 'Statistiques',
        href: '/dashboard',
        icon: ChartBarIcon,
      },
    ];

    if (isSuperAdmin) {
      return [
        ...baseItems,
        {
          name: 'Entreprises',
          href: '/companies',
          icon: BuildingOfficeIcon,
        },
        {
          name: 'Tarification',
          href: '/pricing',
          icon: CurrencyDollarIcon,
        },
        {
          name: 'Paramètres',
          href: '/settings',
          icon: Cog6ToothIcon,
        },
      ];
    } else if (isAdmin) {
      return [
        ...baseItems,
        {
          name: 'Employés',
          href: '/employees',
          icon: UsersIcon,
        },
        {
          name: 'Pointage',
          href: '/attendance',
          icon: ClockIcon,
        },
        {
          name: 'Paramètres',
          href: '/settings',
          icon: Cog6ToothIcon,
        },
        {
          name: 'Payruns',
          href: '/payruns',
          icon: DocumentTextIcon,
        },
        {
          name: 'Bulletins de Paie',
          href: '/payslips',
          icon: DocumentTextIcon,
        },
        {
          name: 'Paiements',
          href: '/payments',
          icon: CreditCardIcon,
        },
      ];
    } else if (isCaissier) {
      return [
        ...baseItems,
        {
          name: 'Paiements',
          href: '/payments',
          icon: CreditCardIcon,
        },
      ];
    } else if (isVigile) {
      return [
        ...baseItems,
        {
          name: 'Surveillance Pointages',
          href: '/attendance',
          icon: ClockIcon,
        },
      ];
    }

    // Pour les employés
    return [
      ...baseItems,
      {
        name: 'Mon Pointage',
        href: '/attendance',
        icon: ClockIcon,
      },
    ];
  };

  const menuItems = getMenuItems();


  const handleLogout = () => {
    logout();
    navigate('/');
  };


  const handleSwitchBack = async () => {
    try {
      const result = await switchBackToSuperAdmin();
      if (result.success) {
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
    <div className={clsx(
      "fixed top-16 left-0 h-screen transition-all duration-300 ease-in-out z-10",
      theme === 'dark'
        ? "bg-slate-900/95 border-slate-700/50"
        : "bg-white/95 border-gray-200/50",
      isExpanded ? "w-64" : "w-16"
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          "absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 z-10 backdrop-blur-sm",
          theme === 'dark'
            ? "bg-slate-700/80 border border-slate-600/50 hover:bg-slate-600/80"
            : "bg-gray-200/80 border border-gray-300/50 hover:bg-gray-300/80"
        )}
      >
        {isExpanded ? (
          <XMarkIcon className={clsx(
            "w-3 h-3",
            theme === 'dark' ? "text-slate-300" : "text-gray-600"
          )} />
        ) : (
          <Bars3Icon className={clsx(
            "w-3 h-3",
            theme === 'dark' ? "text-slate-300" : "text-gray-600"
          )} />
        )}
      </button>

      {/* Header */}
      <div className={clsx(
        "p-4 border-b",
        theme === 'dark' ? "border-slate-700/50" : "border-gray-200/50"
      )}>
        {isExpanded ? (
          <div className="flex items-center space-x-3">
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm",
              theme === 'dark' ? "bg-slate-700/50" : "bg-gray-200/50"
            )}>
              <span className={clsx(
                "text-sm font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {user?.nom?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <p className={clsx(
                "text-sm font-medium truncate",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {user?.nom || 'Admin'}
              </p>
              <p className={clsx(
                "text-xs",
                theme === 'dark' ? "text-slate-400" : "text-gray-500"
              )}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Utilisateur'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm",
              theme === 'dark' ? "bg-slate-700/50" : "bg-gray-200/50"
            )}>
              <span className={clsx(
                "text-sm font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {user?.nom?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                  isExpanded ? 'justify-start' : 'justify-center',
                  isActive
                    ? theme === 'dark'
                      ? 'bg-slate-700/80 text-white border-l-2'
                      : 'bg-secondary-100/50 text-secondary-900 border-l-2'
                    : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                )}
                style={isActive ? { borderLeftColor: 'var(--color-primary)' } : {}}
              >
                <item.icon
                  className={clsx(
                    'w-5 h-5 transition-colors duration-200 flex-shrink-0',
                    isActive
                      ? ''
                      : theme === 'dark'
                        ? 'text-slate-400 group-hover:text-gray-300'
                        : 'text-gray-400 group-hover:text-gray-600'
                  )}
                  style={isActive ? { color: 'var(--color-primary)' } : {}}
                />
                {isExpanded && (
                  <span className="transition-opacity duration-200">
                    {item.name}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary-400 rounded-r-full"></div>
                )}
              </Link>
            );
          })}

        {/* Bouton retour super-admin */}
        {isSuperAdminInCompanyMode && (
          <button
            onClick={handleSwitchBack}
            className={clsx(
              'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group w-full backdrop-blur-sm',
              isExpanded ? 'justify-start' : 'justify-center',
              theme === 'dark'
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            )}
          >
            <ArrowLeftIcon className={clsx(
              "w-5 h-5 flex-shrink-0",
              theme === 'dark'
                ? "text-slate-400 group-hover:text-gray-300"
                : "text-gray-400 group-hover:text-gray-600"
            )} style={{ color: 'var(--color-primary)' }} />
            {isExpanded && (
              <span className="transition-opacity duration-200">
                Retour Super-Admin
              </span>
            )}
          </button>
        )}
      </nav>


      {/* Logout */}
      <div className={clsx(
        "p-4 border-t",
        theme === 'dark' ? "border-slate-700/50" : "border-gray-200/50"
      )}>
        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group w-full backdrop-blur-sm',
            isExpanded ? 'justify-start' : 'justify-center',
            theme === 'dark'
              ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          )}
        >
          <ArrowRightOnRectangleIcon className={clsx(
            "w-5 h-5 flex-shrink-0",
            theme === 'dark'
              ? "text-slate-400 group-hover:text-red-400"
              : "text-gray-400 group-hover:text-red-400"
          )} />
          {isExpanded && (
            <span className="transition-opacity duration-200">
              Déconnexion
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;