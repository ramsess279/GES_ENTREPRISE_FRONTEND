import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { employeesAPI } from '../utils/api';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const EmployeesPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    nomComplet: '',
    email: '',
    telephone: '',
    poste: 'employe',
    postePersonnalise: '',
    typeContrat: 'CDI',
    salaireBase: '',
    coordonneeBancaire: '',
    situationMatrimoniale: 'célibataire',
    nationalite: 'sénégalaise',
  });
  const [formErrors, setFormErrors] = useState({});

  const itemsPerPage = 10;

  // Charger les employés
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        typeContrat: contractFilter !== 'all' ? contractFilter : undefined,
      });

      setEmployees(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, contractFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nomComplet.trim()) {
      errors.nomComplet = 'Le nom complet est obligatoire';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'L\'email n\'est pas valide';
    }

    if (!formData.telephone.trim()) {
      errors.telephone = 'Le téléphone est obligatoire';
    }

    if (!formData.poste) {
      errors.poste = 'Le poste est obligatoire';
    }

    if (formData.poste === 'employe' && !formData.postePersonnalise.trim()) {
      errors.postePersonnalise = 'Le poste personnalisé est obligatoire';
    }

    if (!formData.typeContrat) {
      errors.typeContrat = 'Le type de contrat est obligatoire';
    }

    if (!formData.salaireBase || formData.salaireBase <= 0) {
      errors.salaireBase = 'Le salaire de base doit être supérieur à 0';
    }

    if (!formData.coordonneeBancaire.trim()) {
      errors.coordonneeBancaire = 'Les coordonnées bancaires sont obligatoires';
    }

    if (!formData.nationalite.trim()) {
      errors.nationalite = 'La nationalité est obligatoire';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const dataToSend = { ...formData, entrepriseId: user.entrepriseId };

      if (editingEmployee) {
        await employeesAPI.update(editingEmployee.id, dataToSend);
        alert('Employé modifié avec succès !');
      } else {
        await employeesAPI.create(dataToSend);
        alert('Employé ajouté avec succès !');
      }
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      setFormErrors({});
      loadEmployees();
    } catch (error) {
      alert('Erreur lors de la sauvegarde: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      nomComplet: '',
      email: '',
      telephone: '',
      poste: 'employe',
      postePersonnalise: '',
      typeContrat: 'CDI',
      salaireBase: '',
      coordonneeBancaire: '',
      situationMatrimoniale: 'célibataire',
      nationalite: 'sénégalaise',
    });
    setFormErrors({});
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      nomComplet: employee.nomComplet,
      email: employee.email,
      telephone: employee.telephone,
      poste: employee.poste || 'employe',
      postePersonnalise: employee.postePersonnalise || '',
      typeContrat: employee.typeContrat,
      salaireBase: employee.salaireBase,
      coordonneeBancaire: employee.coordonneeBancaire,
      situationMatrimoniale: employee.situationMatrimoniale,
      nationalite: employee.nationalite,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        await employeesAPI.delete(id);
        loadEmployees();
      } catch (error) {
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Gestion des Employés
          </h1>
          <p className="text-secondary-600 dark:text-slate-300 mt-1">
            Gérez les employés de votre entreprise
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nouvel employé
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <Input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </Select>
            <Select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
            >
              <option value="all">Tous les contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="journalier">Journalier</option>
              <option value="honoraire">Honoraire</option>
            </Select>
            <Button variant="outline" onClick={loadEmployees}>
              Actualiser
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Table des employés */}
      <Card>
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 dark:text-slate-300 mt-4">Chargement...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Aucun employé trouvé
              </h3>
              <p className="text-secondary-600 dark:text-slate-300">
                Commencez par ajouter votre premier employé
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50 dark:bg-secondary-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Employé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Poste
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Contrat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                        Salaire
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
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {employee.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-secondary-900 dark:text-white">
                                {employee.nomComplet}
                              </div>
                              <div className="text-sm text-secondary-500 dark:text-slate-300">
                                {employee.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-secondary-900 dark:text-white">
                            {employee.poste === 'employe' ? employee.postePersonnalise : employee.poste}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {employee.typeContrat}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {formatCurrency(employee.salaireBase)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.statut === 'actif'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {employee.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(employee)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(employee.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TrashIcon className="w-4 h-4" />
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

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
              {editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom complet"
                name="nomComplet"
                value={formData.nomComplet}
                onChange={handleInputChange}
                error={formErrors.nomComplet}
              />
              <Input
                label="Email"
                
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                error={formErrors.email}
              />
              <Input
                label="Téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                error={formErrors.telephone}
              />
              <Select
                label="Poste"
                name="poste"
                value={formData.poste}
                onChange={handleInputChange}
                error={formErrors.poste}
              >
                <option value="caissier">Caissier</option>
                <option value="vigile">Vigile</option>
                <option value="employe">Employé</option>
              </Select>
              {formData.poste === 'employe' && (
                <Input
                  label="Poste personnalisé"
                  name="postePersonnalise"
                  value={formData.postePersonnalise}
                  onChange={handleInputChange}
                  error={formErrors.postePersonnalise}
                  placeholder="Entrez le poste personnalisé"
                />
              )}
              <Select
                label="Type de contrat"
                name="typeContrat"
                value={formData.typeContrat}
                onChange={handleInputChange}
                error={formErrors.typeContrat}
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="journalier">Journalier</option>
                <option value="honoraire">Honoraire</option>
              </Select>
              <Input
                label="Salaire de base"
                
                name="salaireBase"
                value={formData.salaireBase}
                onChange={handleInputChange}
                error={formErrors.salaireBase}
              />
              <Input
                label="Coordonnées bancaires"
                name="coordonneeBancaire"
                value={formData.coordonneeBancaire}
                onChange={handleInputChange}
                error={formErrors.coordonneeBancaire}
              />
              <Select
                label="Situation matrimoniale"
                name="situationMatrimoniale"
                value={formData.situationMatrimoniale}
                onChange={handleInputChange}
              >
                <option value="célibataire">Célibataire</option>
                <option value="marié">Marié</option>
                <option value="divorcé">Divorcé</option>
                <option value="veuf">Veuf</option>
              </Select>
              <Input
                label="Nationalité"
                name="nationalite"
                value={formData.nationalite}
                onChange={handleInputChange}
                error={formErrors.nationalite}
              />
             </div>
             <div className="flex space-x-2 pt-4">
               <Button type="submit" onClick={handleSubmit}>
                 {editingEmployee ? 'Modifier' : 'Ajouter'}
               </Button>
               <Button
                 type="button"
                 variant="outline"
                 onClick={() => {
                   setShowModal(false);
                   setEditingEmployee(null);
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

export default EmployeesPage;