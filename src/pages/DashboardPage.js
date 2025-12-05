import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import api from '../utils/api';
import {
  CurrencyDollarIcon,
  UsersIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const DashboardPage = () => {
  const { user, isAdmin, isVigile } = useAuth();
  const isCompanyUser = isAdmin || isVigile || user?.role === 'caissier'; // Admin, vigile ou caissier voient les stats de leur entreprise
  const [stats, setStats] = useState({
    totalCompanies: 0,
    compliantCompanies: 0,
    totalRevenue: 0,
    totalSalaryMass: 0,
    frequencyEvolution: [],
    upcomingPayments: [],
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    totalPointagesToday: 0,
  });
  const [companyInfo, setCompanyInfo] = useState(null);
  const [companyRequests, setCompanyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis l'API backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard');
        const data = response.data.data;
        setCompanyInfo(data.companyInfo);

        if (isCompanyUser) {
          if (user?.role === 'vigile') {
            // Pour vigile, afficher les stats de présence
            setStats({
              totalCompanies: 1,
              compliantCompanies: 1,
              totalRevenue: 0,
              totalSalaryMass: 0,
              frequencyEvolution: data.frequencyEvolution || [],
              upcomingPayments: data.upcomingPayments || [],
              totalEmployees: data.stats.totalEmployees || 0,
              presentToday: data.stats.presentToday || 0,
              absentToday: data.stats.absentToday || 0,
              totalPointagesToday: data.stats.totalPointagesToday || 0,
              pendingPayments: 0,
            });
          } else {
            // Pour admin, adapter les stats d'entreprise
            setStats({
              totalCompanies: 1, // Leur entreprise
              compliantCompanies: data.stats.compliantCompanies || 1,
              totalRevenue: data.stats.totalRevenue || 0,
              totalSalaryMass: data.stats.totalSalaryMass || 0,
              frequencyEvolution: data.frequencyEvolution || [],
              upcomingPayments: data.upcomingPayments || [],
              totalEmployees: data.stats.totalEmployees || 0,
              pendingPayments: data.stats.pendingPayments || 0,
            });
          }
        } else {
          setStats({
            totalCompanies: data.stats.totalCompanies,
            compliantCompanies: data.stats.compliantCompanies,
            totalRevenue: data.stats.totalRevenue,
            totalSalaryMass: data.stats.totalSalaryMass,
            frequencyEvolution: data.frequencyEvolution,
            upcomingPayments: data.upcomingPayments,
          });

          // Charger les demandes de création d'entreprises pour super-admin en mode global
          if (user?.role === 'super-admin' && !user?.entrepriseId) {
            try {
              const requestsResponse = await api.get('/entreprises/requests');
              setCompanyRequests(requestsResponse.data.data);
            } catch (error) {
              console.error('Erreur lors du chargement des demandes:', error);
              setCompanyRequests([]);
            }
          } else {
            setCompanyRequests([]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du dashboard:', error);
        // En cas d'erreur, on peut garder des valeurs par défaut ou afficher un message d'erreur
        setStats({
          totalCompanies: 0,
          compliantCompanies: 0,
          totalRevenue: 0,
          totalSalaryMass: 0,
          frequencyEvolution: [],
          upcomingPayments: [],
          totalEmployees: 0,
          pendingPayments: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isCompanyUser, user?.role, user?.entrepriseId]);

  // Données pour les graphiques
  const frequencyEvolutionData = stats.frequencyEvolution;

  const complianceData = [
    { name: 'En règle', value: stats.compliantCompanies, color: '#10b981' },
    { name: 'À régulariser', value: stats.totalCompanies - stats.compliantCompanies, color: '#ef4444' },
  ];


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen dark:bg-slate-900 bg-gray-50 relative overflow-hidden"
      style={companyInfo?.couleurPrimaire ? {
        '--company-primary': companyInfo.couleurPrimaire,
        backgroundColor: `${companyInfo.couleurPrimaire}05` // Très légère teinte de fond
      } : {}}
    >
      {/* Background Effects - Same as homepage */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 dark:bg-white/5 bg-gray-200/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 dark:bg-white/5 bg-gray-200/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] dark:bg-white/3 bg-gray-200/3 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary-900/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-900/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">
            {user?.role === 'vigile' ? `Vigile ${user?.nom}` :
             user?.role === 'caissier' ? `Caissier ${user?.nom}` :
             `Bonjour`}
          </h1>
          <p className="dark:text-slate-300 text-gray-600 mt-1">
            {user?.role === 'vigile'
              ? 'Tableau de bord de surveillance des pointages'
              : user?.role === 'caissier'
              ? 'Tableau de bord des paiements et encaissements'
              : 'Voici un aperçu de votre activité'
            }
          </p>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isCompanyUser ? (
          user?.role === 'caissier' ? (
            // Cartes pour le caissier - statistiques de paiements
            <>
              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Paiements aujourd'hui
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-gray-900">
                      {stats.totalPaymentsToday || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <CreditCardIcon className="w-6 h-6" style={{ color: companyInfo?.couleurPrimaire || '#10b981' }} />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Montant encaissé
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(stats.totalAmountToday || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Paiements en attente
                    </p>
                    <p className="text-2xl font-bold text-orange-400">
                      {stats.pendingPaymentsToday || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Employés payés ce mois
                    </p>
                    <p className="text-2xl font-bold text-primary-dynamic">
                      {stats.employeesPaidThisMonth || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-primary-dynamic" />
                  </div>
                </div>
              </div>
            </>
          ) : user?.role === 'vigile' ? (
            // Cartes pour le vigile - statistiques de présence
            <>
              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Employés totaux
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-gray-900">
                      {stats.totalEmployees}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-6 h-6" style={{ color: companyInfo?.couleurPrimaire || '#10b981' }} />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Présents aujourd'hui
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {stats.presentToday}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Absents aujourd'hui
                    </p>
                    <p className="text-2xl font-bold text-red-400">
                      {stats.absentToday}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Total pointages
                    </p>
                    <p className="text-2xl font-bold text-primary-dynamic">
                      {stats.totalPointagesToday}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-primary-dynamic" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Taux d'absence mensuel
                    </p>
                    <p className="text-2xl font-bold text-orange-400">
                      {stats.totalEmployees > 0 ? Math.round(((stats.totalEmployees - (stats.presentToday || 0)) / stats.totalEmployees) * 100) : 0}%
                    </p>
                    <p className="text-xs dark:text-slate-400 text-gray-500">
                      Estimation basée sur aujourd'hui
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Cartes pour l'admin - statistiques d'entreprise
            <>
              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Employés totaux
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-gray-900">
                      {stats.totalEmployees}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-6 h-6" style={{ color: companyInfo?.couleurPrimaire || '#10b981' }} />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Masse salariale
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-gray-900">
                      {formatCurrency(stats.totalSalaryMass)}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-accent-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Paiements en attente
                    </p>
                    <p className="text-2xl font-bold text-orange-400">
                      {stats.pendingPayments}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                      Payruns ce mois
                    </p>
                    <p className="text-2xl font-bold text-primary-dynamic">
                      {stats.frequencyEvolution?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-primary-dynamic" />
                  </div>
                </div>
              </div>
            </>
          )
        ) : (
          <>
            <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                    Entreprises totales
                  </p>
                  <p className="text-2xl font-bold dark:text-white text-gray-900">
                    {stats.totalCompanies}
                  </p>
                </div>
                <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-primary-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                    Entreprises en règle
                  </p>
                  <p className="text-2xl font-bold text-primary-dynamic">
                    {stats.compliantCompanies}
                  </p>
                  <p className="text-xs dark:text-slate-400 text-gray-500">
                    {Math.round((stats.compliantCompanies / stats.totalCompanies) * 100)}% du total
                  </p>
                </div>
                <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-primary-dynamic" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                    Chiffre d'affaires
                  </p>
                  <p className="text-2xl font-bold dark:text-white text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6" style={{ color: companyInfo?.couleurPrimaire || '#059669' }} />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 hover:dark:bg-white/20 hover:bg-gray-100/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium dark:text-slate-300 text-gray-600">
                    Masse salariale totale
                  </p>
                  <p className="text-2xl font-bold dark:text-white text-gray-900">
                    {formatCurrency(stats.totalSalaryMass)}
                  </p>
                </div>
                <div className="w-12 h-12 dark:bg-white/10 bg-gray-200/10 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <>
        {isCompanyUser ? (
          user?.role === 'caissier' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Payment Activity */}
              <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
                <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
                  <h3 className="text-lg font-semibold dark:text-white text-gray-900">Activité de paiement aujourd'hui</h3>
                  <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Nombre de paiements effectués</p>
                </div>
                <div className="p-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <CreditCardIcon className="w-16 h-16 text-primary-dynamic mx-auto mb-4" />
                      <p className="text-secondary-600 dark:text-slate-300">Paiements du jour</p>
                      <p className="text-sm text-secondary-500 dark:text-slate-400 mt-2">
                        Total: {stats.totalPaymentsToday || 0} paiements
                      </p>
                      <p className="text-sm text-secondary-500 dark:text-slate-400">
                        Montant: {formatCurrency(stats.totalAmountToday || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Distribution */}
              <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
                <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
                  <h3 className="text-lg font-semibold dark:text-white text-gray-900">Modes de paiement utilisés</h3>
                  <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Répartition par méthode aujourd'hui</p>
                </div>
                <div className="p-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <CurrencyDollarIcon className="w-16 h-16 text-accent-400 mx-auto mb-4" />
                      <p className="text-secondary-600 dark:text-slate-300">Modes de paiement</p>
                      <p className="text-sm text-secondary-500 dark:text-slate-400 mt-2">
                        Espèces, Virement, Orange Money, Wave
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : user?.role === 'vigile' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Status Distribution */}
              <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
                <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
                  <h3 className="text-lg font-semibold dark:text-white text-gray-900">Présence aujourd'hui</h3>
                  <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Répartition présents/absents</p>
                </div>
                <div className="p-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <UsersIcon className="w-16 h-16 text-primary-dynamic mx-auto mb-4" />
                      <p className="text-secondary-600 dark:text-slate-300">Statistiques de présence</p>
                      <p className="text-sm text-secondary-500 dark:text-slate-400 mt-2">
                        Présents: {stats.presentToday || 0} | Absents: {stats.absentToday || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pointage Activity */}
              <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
                <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
                  <h3 className="text-lg font-semibold dark:text-white text-gray-900">Activité de pointage</h3>
                  <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Nombre total de pointages aujourd'hui</p>
                </div>
                <div className="p-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <DocumentTextIcon className="w-16 h-16 text-accent-400 mx-auto mb-4" />
                      <p className="text-secondary-600 dark:text-slate-300">Pointages du jour</p>
                      <p className="text-sm text-secondary-500 dark:text-slate-400 mt-2">
                        Total: {stats.totalPointagesToday || 0} pointages
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee Status Distribution */}
              <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
                <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
                  <h3 className="text-lg font-semibold dark:text-white text-gray-900">Statut des employés</h3>
                  <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Répartition actif/inactif</p>
                </div>
                <div className="p-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <UsersIcon className="w-16 h-16 text-primary-dynamic mx-auto mb-4" />
                      <p className="text-secondary-600 dark:text-slate-300">Graphique des employés</p>
                      <p className="text-sm text-secondary-500 dark:text-slate-400 mt-2">
                        Actifs: {stats.totalEmployees || 0} | Inactifs: 0
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Distribution */}
              <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
                <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
                  <h3 className="text-lg font-semibold dark:text-white text-gray-900">Modes de paiement</h3>
                  <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Répartition par méthode</p>
                </div>
                <div className="p-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <CreditCardIcon className="w-16 h-16 text-accent-400 mx-auto mb-4" />
                      <p className="text-secondary-600 dark:text-slate-300">Graphique des paiements</p>
                      <p className="text-sm text-secondary-500 dark:text-slate-400 mt-2">
                        Espèces, Virement, Orange Money, Wave
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Frequency Evolution Chart */}
            <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
              <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
                <h3 className="text-lg font-semibold dark:text-white text-gray-900">Évolution des fréquences</h3>
                <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Taux de paiement mensuel (%)</p>
              </div>
              <div className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={frequencyEvolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                      <XAxis dataKey="month" stroke="currentColor" opacity={0.7} />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="currentColor" opacity={0.7} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Fréquence']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="frequency"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Compliance Distribution */}
            <div className="glass-card rounded-2xl backdrop-blur-2xl bg-slate-800/50 border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-white">Statut des entreprises</h3>
                <p className="text-sm text-slate-300 mt-1">Conformité réglementaire</p>
              </div>
              <div className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {complianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center space-x-6 mt-4">
                  {complianceData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-slate-300">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Payments - Only for super-admin */}
        {!isCompanyUser && (
          <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
            <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">Prochains paiements entreprises</h3>
              <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Facturations à envoyer cette semaine</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.upcomingPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 dark:bg-white/5 bg-gray-50/50 rounded-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 dark:bg-white/10 bg-gray-200/10 rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5 text-primary-dynamic" />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white text-gray-900">{payment.name}</p>
                        <p className="text-sm dark:text-slate-300 text-gray-600">
                          Échéance: {formatDate(payment.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold dark:text-white text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <Button size="sm" variant="outline" className="dark:bg-white/10 bg-gray-100/10 dark:border-white/20 border-gray-300/20 dark:text-white text-gray-900">
                        Facturer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Company Creation Requests - Only for super-admin in global mode */}
        {user?.role === 'super-admin' && !user?.entrepriseId && companyRequests.length > 0 && (
          <div className="glass-card rounded-2xl backdrop-blur-2xl dark:bg-white/15 bg-gray-100/15 dark:border-white/30 border-gray-300/30 overflow-hidden">
            <div className="p-6 border-b dark:border-white/10 border-gray-300/10">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">Demandes de création d'entreprises</h3>
              <p className="text-sm dark:text-slate-300 text-gray-600 mt-1">Nouvelles demandes en attente de validation</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {companyRequests.map((request, index) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 dark:bg-white/5 bg-gray-50/50 rounded-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 dark:bg-white/10 bg-gray-200/10 rounded-full flex items-center justify-center">
                        <BuildingOfficeIcon className="w-5 h-5 text-primary-dynamic" />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white text-gray-900">{request.nomEntreprise}</p>
                        <p className="text-sm dark:text-slate-300 text-gray-600">
                          Contact: {request.nomContact} - {request.email}
                        </p>
                        <p className="text-sm dark:text-slate-400 text-gray-500">
                          Reçu le: {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-x-2">
                      <Button size="sm" variant="outline" className="dark:bg-green-500/20 bg-green-100/20 dark:border-green-500/30 border-green-300/30 dark:text-green-400 text-green-700">
                        Approuver
                      </Button>
                      <Button size="sm" variant="outline" className="dark:bg-red-500/20 bg-red-100/20 dark:border-red-500/30 border-red-300/30 dark:text-red-400 text-red-700">
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
      </div>
    </div>
  );
};

export default DashboardPage;