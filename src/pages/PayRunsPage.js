import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { payrunsAPI, companiesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const PayRunsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    periode: '',
    type: 'mensuelle',
    dateDebut: '',
    dateFin: '',
    heureDebut: '',
    heureFin: '',
    entrepriseId: '',
  });

  const itemsPerPage = 10;

  // Charger les cycles de paie
  const loadPayruns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await payrunsAPI.getAll({
        page: currentPage,
        limit: itemsPerPage,
      });
      setPayruns(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      setPayruns([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Charger les entreprises
  const loadCompanies = async () => {
    try {
      const response = await companiesAPI.getAll();
      setCompanies(response.data.data || []);
    } catch (error) {
    }
  };

  useEffect(() => {
    loadPayruns();
    loadCompanies();
  }, [currentPage, loadPayruns]);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await payrunsAPI.create(formData);
      setShowModal(false);
      resetForm();
      loadPayruns();
    } catch (error) {
    }
  };

  const resetForm = () => {
    setFormData({
      periode: '',
      type: 'mensuelle',
      dateDebut: '',
      dateFin: '',
      heureDebut: '',
      heureFin: '',
      entrepriseId: '',
    });
  };

  const handleApprove = async (id) => {
    try {
      await payrunsAPI.approve(id);
      loadPayruns();
    } catch (error) {
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cycle de paie ? Cette action est irréversible.')) {
      try {
        await payrunsAPI.delete(id);
        loadPayruns();
      } catch (error) {
        alert('Erreur lors de la suppression: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleViewDetails = (payrun) => {
    navigate(`/payruns/${payrun.id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'brouillon':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'approuvé':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'clôturé':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'brouillon':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approuvé':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'clôturé':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Cycles de Paie
          </h1>
          <p className="text-secondary-600 dark:text-slate-300 mt-1">
            Gérez les cycles de paie et générez les bulletins
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nouveau cycle
        </Button>
      </div>

      {/* Table des cycles de paie */}
      <Card>
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 dark:text-slate-300 mt-4">Chargement...</p>
            </div>
          ) : payruns.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Aucun cycle de paie
              </h3>
              <p className="text-secondary-600 dark:text-slate-300">
                Créez votre premier cycle de paie
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50 dark:bg-secondary-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Date création
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                    {payruns.map((payrun) => (
                      <tr key={payrun.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-secondary-900 dark:text-white">
                            {payrun.periode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white capitalize">
                          {payrun.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {formatDate(payrun.dateCreation)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payrun.statut)}`}>
                            {getStatusIcon(payrun.statut)}
                            <span className="ml-1 capitalize">{payrun.statut.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {payrun.statut === 'brouillon' && (
                              <button
                                onClick={() => handleApprove(payrun.id)}
                                className="text-primary-dynamic hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                title="Approuver le cycle"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            {payrun.statut !== 'approuvé' && (
                              <button
                                onClick={() => handleDelete(payrun.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Supprimer le cycle"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetails(payrun)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Voir les détails et bulletins"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white dark:bg-secondary-900 px-4 py-3 flex items-center justify-between border-t border-secondary-200 dark:border-secondary-700 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-secondary-700 dark:text-slate-300">
                        Page <span className="font-medium">{currentPage}</span> sur{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="rounded-l-md"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="rounded-r-md"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
              Nouveau cycle de paie
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Période"
                name="periode"
                value={formData.periode}
                onChange={handleInputChange}
                placeholder="Ex: Septembre 2024"
               
              />
              <Select
                label="Type de cycle"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
               
              >
                <option value="mensuelle">Mensuelle</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="journaliere">Journalière</option>
              </Select>
              {/* Le champ entreprise n'est affiché que pour les super-admin sans entrepriseId */}
              {user?.role === 'super-admin' && !user?.entrepriseId && (
                <Select
                  label="Entreprise"
                  name="entrepriseId"
                  value={formData.entrepriseId}
                  onChange={handleInputChange}
                 
                >
                  <option value="">Sélectionner une entreprise</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.nom}
                    </option>
                  ))}
                </Select>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date début"
                  
                  name="dateDebut"
                  value={formData.dateDebut}
                  onChange={handleInputChange}
                />
                <Input
                  label="Date fin"
                  
                  name="dateFin"
                  value={formData.dateFin}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Heure début"
                  type="time"
                  name="heureDebut"
                  value={formData.heureDebut}
                  onChange={handleInputChange}
                />
                <Input
                  label="Heure fin"
                  type="time"
                  name="heureFin"
                  value={formData.heureFin}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit">
                  Créer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayRunsPage;