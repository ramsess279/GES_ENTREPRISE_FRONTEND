import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { companiesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { MagnifyingGlassIcon, EyeIcon, CheckIcon, XMarkIcon, BellIcon, PlusIcon } from '@heroicons/react/24/outline';

const CompaniesPage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyRequests, setCompanyRequests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    devise: 'XOF',
    typePeriode: 'mensuelle',
    adminUserData: {
      nomComplet: '',
      emailUtilisateur: '',
      telephone: ''
    }
  });
  const [formErrors, setFormErrors] = useState({});
  const itemsPerPage = 10;

  // Fetch company requests and companies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsResponse, companiesResponse] = await Promise.all([
          companiesAPI.getRequests(),
          companiesAPI.getAll()
        ]);
        setCompanyRequests(requestsResponse.data.data);
        setCompanies(companiesResponse.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setCompanyRequests([]);
        setCompanies([]);
      } finally {
        setLoadingRequests(false);
        setLoadingCompanies(false);
      }
    };

    fetchData();
  }, []);

  const filteredCompanies = (companies || []).filter(company =>
    company.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + itemsPerPage);

  const handleApproveRequest = async (requestId) => {
    try {
      await companiesAPI.approveRequest(requestId);
      setCompanyRequests(prev => prev.filter(req => req.id !== requestId));
      // Refresh companies list
      const companiesResponse = await companiesAPI.getAll();
      setCompanies(companiesResponse.data);
      alert(`Demande ${requestId} approuvée`);
      setShowRequestModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await companiesAPI.rejectRequest(requestId);
      setCompanyRequests(prev => prev.filter(req => req.id !== requestId));
      alert(`Demande ${requestId} rejetée`);
      setShowRequestModal(false);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert('Erreur lors du rejet');
    }
  };

  const handleViewCompany = (company) => {
    navigate(`/companies/${company.id}`);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nom.trim()) {
      errors.nom = 'Le nom de l\'entreprise est obligatoire';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'L\'email n\'est pas valide';
    }

    // Validation des données admin
    if (!formData.adminUserData.nomComplet.trim()) {
      errors.nomComplet = 'Le nom complet de l\'administrateur est obligatoire';
    }

    if (!formData.adminUserData.emailUtilisateur.trim()) {
      errors.emailUtilisateur = 'L\'email de l\'administrateur est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminUserData.emailUtilisateur)) {
      errors.emailUtilisateur = 'L\'email de l\'administrateur n\'est pas valide';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setCreating(true);
    try {
      const { adminUserData, ...companyData } = formData;
      await companiesAPI.create({ ...companyData, adminUserData });
      setShowCreateModal(false);
      setFormData({
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        devise: 'XOF',
        typePeriode: 'mensuelle',
        adminUserData: {
          nomComplet: '',
          emailUtilisateur: '',
          telephone: ''
        }
      });
      setFormErrors({});
      // Refresh companies list
      const companiesResponse = await companiesAPI.getAll();
      setCompanies(companiesResponse.data);
      alert('Entreprise créée avec succès. Un email avec les informations de connexion a été envoyé à l\'administrateur.');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création de l\'entreprise';
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      devise: 'XOF',
      typePeriode: 'mensuelle',
      adminUserData: {
        nomComplet: '',
        emailUtilisateur: '',
        telephone: ''
      }
    });
  };

  if (loadingRequests || loadingCompanies) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Gestion des Entreprises
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Gérez toutes les entreprises de la plateforme
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouvelle Entreprise
          </Button>
        )}
      </div>

      {/* Notifications Section */}
      <Card variant="secondary">
        <Card.Header>
          <div className="flex items-center space-x-2">
            <BellIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            <Card.Title>Demandes de création d'entreprises</Card.Title>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="flex items-center justify-between">
            <p className="text-secondary-600 dark:text-secondary-400">
              {companyRequests.length} demande{companyRequests.length > 1 ? 's' : ''} en attente
            </p>
            <div className="flex space-x-2">
              {companyRequests.map(request => (
                <Button
                  key={request.id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowRequestModal(true);
                  }}
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  Voir #{request.id}
                </Button>
              ))}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Search and Companies List */}
      <Card>
        <Card.Header>
          <Card.Title>Liste des entreprises</Card.Title>
        </Card.Header>
        <Card.Content>
          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
              className="max-w-md"
            />
          </div>

          {/* Companies Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Entreprise</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Employés</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Créée le</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map(company => (
                  <tr key={company.id} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className="py-3 px-4">
                      <div className="font-medium text-secondary-900 dark:text-secondary-100">{company.nom}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">{company.email}</div>
                      <div className="text-sm text-secondary-500 dark:text-secondary-500">{company.telephone}</div>
                    </td>
                    <td className="py-3 px-4 text-secondary-900 dark:text-secondary-100">{company.employees || 0}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-secondary-600 dark:text-secondary-400">{new Date(company.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCompany(company)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredCompanies.length)} sur {filteredCompanies.length} entreprises
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Détails de la demande #{selectedRequest.id}
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Nom de l'entreprise
                  </label>
                  <p className="text-secondary-900 dark:text-secondary-100">{selectedRequest.nomEntreprise}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Email de contact
                  </label>
                  <p className="text-secondary-900 dark:text-secondary-100">{selectedRequest.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Téléphone
                  </label>
                  <p className="text-secondary-900 dark:text-secondary-100">{selectedRequest.telephone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Nom du contact
                  </label>
                  <p className="text-secondary-900 dark:text-secondary-100">{selectedRequest.nomContact}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Email utilisateur
                  </label>
                  <p className="text-secondary-900 dark:text-secondary-100">{selectedRequest.emailUtilisateur}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Soumise le
                  </label>
                  <p className="text-secondary-900 dark:text-secondary-100">{new Date(selectedRequest.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={() => handleApproveRequest(selectedRequest.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRejectRequest(selectedRequest.id)}
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Créer une nouvelle entreprise
              </h3>
              <button
                onClick={handleCloseCreateModal}
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom de l'entreprise"
                  value={formData.nom}
                  onChange={(e) => {
                    setFormData({ ...formData, nom: e.target.value });
                    if (formErrors.nom) setFormErrors({ ...formErrors, nom: '' });
                  }}
                  error={formErrors.nom}
                />
                <Input
                  label="Email"
                  
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                  error={formErrors.email}
                />
                <Input
                  label="Téléphone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
                <Select
                  label="Devise"
                  value={formData.devise}
                  onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
                  options={[
                    { value: 'XOF', label: 'Franc CFA (XOF)' },
                    { value: 'EUR', label: 'Euro (EUR)' },
                    { value: 'USD', label: 'Dollar US (USD)' }
                  ]}
                />
                <Select
                  label="Période de paie"
                  value={formData.typePeriode}
                  onChange={(e) => setFormData({ ...formData, typePeriode: e.target.value })}
                  options={[
                    { value: 'mensuelle', label: 'Mensuelle' },
                    { value: 'hebdomadaire', label: 'Hebdomadaire' },
                    { value: 'bihebdomadaire', label: 'Bi-hebdomadaire' }
                  ]}
                />
              </div>
              <Input
                label="Adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              />

              {/* Section Administrateur */}
              <div className="border-t border-secondary-200 dark:border-secondary-700 pt-6 mt-6">
                <h4 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
                  Informations de l'administrateur
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom complet de l'administrateur"
                    value={formData.adminUserData.nomComplet}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        adminUserData: { ...formData.adminUserData, nomComplet: e.target.value }
                      });
                      if (formErrors.nomComplet) setFormErrors({ ...formErrors, nomComplet: '' });
                    }}
                    error={formErrors.nomComplet}
                  />
                  <Input
                    label="Email de connexion de l'administrateur"
                    value={formData.adminUserData.emailUtilisateur}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        adminUserData: { ...formData.adminUserData, emailUtilisateur: e.target.value }
                      });
                      if (formErrors.emailUtilisateur) setFormErrors({ ...formErrors, emailUtilisateur: '' });
                    }}
                    error={formErrors.emailUtilisateur}
                  />
                  <Input
                    label="Téléphone de l'administrateur"
                    value={formData.adminUserData.telephone}
                    onChange={(e) => setFormData({
                      ...formData,
                      adminUserData: { ...formData.adminUserData, telephone: e.target.value }
                    })}
                  />
                </div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                  Un mot de passe temporaire sera généré automatiquement et envoyé à l'administrateur.
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {creating ? 'Création...' : 'Créer l\'entreprise'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseCreateModal}
                  disabled={creating}
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

export default CompaniesPage;