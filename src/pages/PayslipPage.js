import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { payslipsAPI, payrunsAPI, paymentsAPI } from '../utils/api';
import {
  DocumentTextIcon,
  PencilIcon,
  EyeIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

const PayslipPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'paid'
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [expandedCycles, setExpandedCycles] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayrunId, setSelectedPayrunId] = useState('');
  const [formData, setFormData] = useState({
    salaireBrut: '',
    deductions: '',
    nombreJour: '',
    nombreHeure: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    montant: '',
    mode: 'virement',
  });

  const itemsPerPage = 10;

  // Charger les bulletins de paie
  const loadPayslips = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (selectedPayrunId) {
        // Charger les bulletins d'un cycle spécifique
        response = await payslipsAPI.getByPayrun(selectedPayrunId);
        setPayslips(response.data.data || []);
      } else {
        // Charger tous les bulletins des cycles validés avec pagination
        response = await payslipsAPI.getAll({
          page: currentPage,
          limit: itemsPerPage,
        });
        setPayslips(response.data.data || []);
      }
    } catch (error) {
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPayrunId, currentPage, itemsPerPage]);

  // Charger les cycles de paie pour filtrer
  const loadPayruns = async () => {
    try {
      const response = await payrunsAPI.getAll();
      // response.data is an object with data property containing array
      const dataArray = response.data.data || response.data || [];
      const validatedPayruns = dataArray.filter(pr => pr.statut === 'validé' || pr.statut === 'approuvé');
      setPayruns(validatedPayruns);
    } catch (error) {
    }
  };

  useEffect(() => {
    loadPayruns();
  }, []);

  // Cycles are collapsed by default

  useEffect(() => {
    setCurrentPage(1); // Reset pagination when changing filters
  }, [selectedPayrunId, activeTab]);

  useEffect(() => {
    loadPayslips();
  }, [currentPage, activeTab, selectedPayrunId, loadPayslips]);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Recalculer le salaire brut si nombreHeure ou nombreJour change
      if (editingPayslip?.employe) {
        const employee = editingPayslip.employe;
        const salaireBase = employee.salaireBase;

        if (name === 'nombreHeure' && employee.typeContrat === 'honoraire') {
          const heures = parseFloat(value) || 0;
          newData.salaireBrut = (salaireBase * heures).toString();
        } else if (name === 'nombreJour' && employee.typeContrat === 'journalier') {
          const jours = parseFloat(value) || 0;
          newData.salaireBrut = (salaireBase * jours).toString();
        }
      }

      return newData;
    });
  };


  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      await paymentsAPI.create({
        payslipId: selectedPayslip.id,
        montant: parseFloat(paymentForm.montant),
        mode: paymentForm.mode,
      });

      loadPayslips();
      setShowPaymentModal(false);
      setSelectedPayslip(null);
      alert('Paiement enregistré avec succès');
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const handleViewDetails = (payslip) => {
    setViewingPayslip(payslip);
    setShowDetailsModal(true);
  };

  const handleDownloadPDF = async (payslipId) => {
    try {
      // Créer un lien temporaire pour le téléchargement
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3010/api'}/payslips/${payslipId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();

      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob);

      // Créer un lien temporaire et déclencher le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulletin_paie_${payslipId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('PDF téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  const toggleCycleExpansion = (cycleId) => {
    setExpandedCycles(prev => ({
      ...prev,
      [cycleId]: !prev[cycleId]
    }));
  };

  // Grouper les bulletins par cycle
  const groupPayslipsByCycle = (payslips) => {
    const grouped = {};
    payslips.forEach(payslip => {
      const cycleId = payslip.payRunId;
      if (!grouped[cycleId]) {
        grouped[cycleId] = {
          payRun: payslip.payRun,
          payslips: []
        };
      }
      grouped[cycleId].payslips.push(payslip);
    });

    // Calculate cycle status
    Object.keys(grouped).forEach(cycleId => {
      const cyclePayslips = grouped[cycleId].payslips;
      const allPaid = cyclePayslips.every(p => p.statut === 'payé');
      const hasPartial = cyclePayslips.some(p => p.statut === 'partiel');
      if (allPaid) {
        grouped[cycleId].status = 'payé';
      } else if (hasPartial) {
        grouped[cycleId].status = 'partiel';
      } else {
        grouped[cycleId].status = 'validé';
      }
    });

    return grouped;
  };

  // Filtrer les bulletins selon l'onglet actif et la recherche
  const filteredPayslips = payslips.filter(payslip => {
    const matchesStatus = activeTab === 'paid' ? payslip.statut === 'payé' : payslip.statut !== 'payé';
    const matchesSearch = payslip.employe?.nomComplet.toLowerCase().includes(searchTerm.toLowerCase());
    // Si un cycle spécifique est sélectionné, on ne filtre pas par statut du cycle car ils sont déjà filtrés côté serveur
    const matchesValidatedCycle = selectedPayrunId ? true : (payslip.payRun?.statut === 'validé' || payslip.payRun?.statut === 'approuvé');
    return matchesStatus && matchesSearch && matchesValidatedCycle;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await payslipsAPI.update(editingPayslip.id, formData);
      setShowModal(false);
      resetForm();
      loadPayslips();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      salaireBrut: '',
      deductions: '',
      nombreJour: '',
      nombreHeure: '',
    });
    setEditingPayslip(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'validé':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'partiel':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'payé':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec onglets */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Bulletins de Paie
          </h1>
          <p className="text-secondary-600 dark:text-slate-300 mt-1">
            Gérez les bulletins de paie des employés
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-4 items-center">
          <Select
            value={selectedPayrunId}
            onChange={(e) => setSelectedPayrunId(e.target.value)}
            className="w-64"
          >
            <option value="">Tous les cycles validés</option>
            {payruns.map(payrun => (
              <option key={payrun.id} value={payrun.id}>
                {payrun.periode} - {payrun.type}
              </option>
            ))}
          </Select>
          <Input
            type="text"
            placeholder="Rechercher par nom d'employé"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-secondary-200 dark:border-secondary-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            En attente ({filteredPayslips.filter(p => p.statut !== 'payé').length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'paid'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Payés ({filteredPayslips.filter(p => p.statut === 'payé').length})
          </button>
        </nav>
      </div>

      {/* Cycles de paie avec bulletins */}
      <Card>
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 dark:text-slate-300 mt-4">Chargement...</p>
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Aucun bulletin de paie
              </h3>
              <p className="text-secondary-600 dark:text-slate-300">
                {activeTab === 'paid' ? 'Aucun bulletin payé' : 'Créez un cycle de paie pour générer les bulletins'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {Object.entries(groupPayslipsByCycle(filteredPayslips)).map(([cycleId, cycleData]) => (
                <div key={cycleId} className="p-4">
                  {/* En-tête du cycle */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-800 p-3 rounded-lg"
                    onClick={() => toggleCycleExpansion(cycleId)}
                  >
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="w-6 h-6 text-secondary-400" />
                      <div>
                        <h3 className="text-lg font-medium text-secondary-900 dark:text-white">
                          {cycleData.payRun.periode} - {cycleData.payRun.type}
                        </h3>
                        <p className="text-sm text-secondary-600 dark:text-slate-300">
                          {cycleData.payslips.length} employé(s) • Statut: {cycleData.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cycleData.status)}`}>
                        {cycleData.status}
                      </span>
                      <ChevronRightIcon
                        className={`w-5 h-5 text-secondary-400 transform transition-transform ${
                          expandedCycles[cycleId] ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Liste des bulletins (accordéon) */}
                  {expandedCycles[cycleId] && (
                    <div className="mt-4 space-y-3">
                      {cycleData.payslips.map((payslip) => (
                        <div key={payslip.id} className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h4 className="text-sm font-medium text-secondary-900 dark:text-white">
                                    {payslip.employe?.nomComplet}
                                  </h4>
                                  <p className="text-xs text-secondary-600 dark:text-slate-300">
                                    {payslip.employe?.poste}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-secondary-900 dark:text-white">
                                    {payslip.salaireNet?.toLocaleString()} XOF
                                  </p>
                                  <p className="text-xs text-secondary-600 dark:text-slate-300">
                                    Salaire net
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payslip.statut)}`}>
                                {payslip.statut.replace('_', ' ')}
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewDetails(payslip)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Voir détails"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Modal d'édition */}
      {showModal && editingPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
              Modifier le bulletin de {editingPayslip.employe?.nomComplet}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Salaire brut"

                name="salaireBrut"
                value={formData.salaireBrut}
                onChange={handleInputChange}

              />
              <Input
                label="Déductions"

                name="deductions"
                value={formData.deductions}
                onChange={handleInputChange}
              />

              {/* Champs conditionnels selon le type de contrat */}
              {editingPayslip?.employe?.typeContrat === 'journalier' && (
                <Input
                  label="Nombre de jours travaillés"

                  name="nombreJour"
                  value={formData.nombreJour}
                  onChange={handleInputChange}
                />
              )}

              {editingPayslip?.employe?.typeContrat === 'honoraire' && (
                <Input
                  label="Nombre d'heures travaillées"

                  name="nombreHeure"
                  value={formData.nombreHeure}
                  onChange={handleInputChange}
                />
              )}

              {/* Pour CDI/CDD, pas de champs supplémentaires */}
              <div className="flex space-x-2 pt-4">
                <Button type="submit">
                  Mettre à jour
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

      {/* Modal de détails du bulletin */}
      {showDetailsModal && viewingPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            {/* En-tête professionnel */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">BULLETIN DE PAIE</h1>
                  <p className="text-blue-100 mt-1">Période: {viewingPayslip.payRun?.periode}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:text-blue-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Informations entreprise */}
              <div className="mb-8 p-6 bg-gray-50 dark:bg-secondary-700 rounded-lg border-l-4 border-blue-500">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-wide">
                  Informations de l'entreprise
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Nom</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.employe?.entreprise?.nom || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Adresse</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.employe?.entreprise?.adresse || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Téléphone</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.employe?.entreprise?.telephone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Email</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.employe?.entreprise?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Informations employé */}
              <div className="mb-8 p-6 bg-gray-50 dark:bg-secondary-700 rounded-lg border-l-4 border-green-500">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-wide">
                  Informations de l'employé
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Nom complet</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.employe?.nomComplet}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Poste</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.employe?.poste}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Type de contrat</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.employe?.typeContrat}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Email</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.employe?.email}</p>
                  </div>
                </div>
              </div>

              {/* Informations cycle de paie */}
              <div className="mb-8 p-6 bg-gray-50 dark:bg-secondary-700 rounded-lg border-l-4 border-purple-500">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-wide">
                  Cycle de paie
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Période</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.payRun?.periode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Type</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{viewingPayslip.payRun?.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Date de génération</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{formatDate(viewingPayslip.dateGen)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase">Statut</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold uppercase ${getStatusColor(viewingPayslip.statut)}`}>
                      {viewingPayslip.statut.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Détails salariaux - Section principale mise en avant */}
              <div className="mb-8 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-secondary-700 dark:to-secondary-600 rounded-lg border-2 border-blue-200 dark:border-secondary-500">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 uppercase tracking-wide text-center">
                  Détails Salariaux
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase mb-2">Salaire Brut</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{viewingPayslip.salaireBrut?.toLocaleString()} XOF</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
                    <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase mb-2">Déductions</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{viewingPayslip.deductions?.toLocaleString()} XOF</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-700 rounded-lg shadow-md border-2 border-green-300">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200 uppercase mb-2">Salaire Net à Payer</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200">{viewingPayslip.salaireNet?.toLocaleString()} XOF</p>
                  </div>
                </div>

                {/* Section heures/jours travaillés - Mise en avant */}
                {(viewingPayslip.nombreJour || viewingPayslip.nombreHeure) && (
                  <div className="mt-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-600">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center uppercase">
                      Période de Travail
                    </h3>
                    <div className="flex justify-center space-x-8">
                      {viewingPayslip.nombreJour && (
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase mb-1">Jours Travaillés</p>
                          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{viewingPayslip.nombreJour}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">jours</p>
                        </div>
                      )}
                      {viewingPayslip.nombreHeure && (
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase mb-1">Heures Travaillées</p>
                          <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{parseFloat(viewingPayslip.nombreHeure).toFixed(2)}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">heures</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pied de page */}
              <div className="text-center text-sm text-gray-500 dark:text-slate-400 border-t pt-6">
                <p className="mb-2">Ce bulletin de paie est généré automatiquement par le système de gestion salariale.</p>
                <p>Document officiel - {new Date().toLocaleDateString('fr-FR')}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4 mt-8">
                <Button onClick={() => handleDownloadPDF(viewingPayslip.id)} className="bg-blue-600 hover:bg-blue-700">
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  Télécharger PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de paiement */}
      {showPaymentModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
              Enregistrer un paiement pour {selectedPayslip.employe?.nomComplet}
            </h2>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <Input
                label="Montant"
                
                name="montant"
                value={paymentForm.montant}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, montant: e.target.value }))}
               
              />
              <Select
                label="Mode de paiement"
                name="mode"
                value={paymentForm.mode}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, mode: e.target.value }))}
               
              >
                <option value="virement">Virement bancaire</option>
                <option value="espèces">Espèces</option>
                <option value="orange_money">Orange Money</option>
                <option value="wave">Wave</option>
              </Select>
              <div className="flex space-x-2 pt-4">
                <Button type="submit">
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayslip(null);
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

export default PayslipPage;