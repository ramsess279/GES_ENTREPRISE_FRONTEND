 import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { payslipsAPI, paymentsAPI } from '../utils/api';
import {
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const PaymentsPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'partial', 'paid'
  const [showModal, setShowModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    montant: '',
    mode: 'virement',
  });
  const [formErrors, setFormErrors] = useState({});

  const itemsPerPage = 10;

  // Charger les bulletins
  const loadPayslips = async () => {
    try {
      setLoading(true);
      const response = await payslipsAPI.getAll({
        page: currentPage,
        limit: itemsPerPage,
      });
      const allPayslips = response.data.data || [];
      setPayslips(allPayslips);
      setTotalPages(Math.ceil((allPayslips.length || 0) / itemsPerPage));
    } catch (error) {
      console.error('Erreur lors du chargement des bulletins:', error);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, [currentPage, activeTab]);

  // Filtrer les bulletins selon l'onglet actif et la recherche
  const filteredPayslips = payslips.filter(payslip => {
    const matchesStatus = (() => {
      switch (activeTab) {
        case 'pending':
          return payslip.statut === 'en_attente' || payslip.statut === 'validé' || payslip.statut === 'verrouillé';
        case 'partial':
          return payslip.statut === 'partiel';
        case 'paid':
          return payslip.statut === 'payé';
        default:
          return true;
      }
    })();
    const matchesSearch = payslip.employe?.nomComplet.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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

    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      errors.montant = 'Le montant doit être supérieur à 0';
    }

    const totalPaid = selectedPayslip?.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0;
    const remaining = selectedPayslip?.salaireNet - totalPaid;
    if (parseFloat(formData.montant) > remaining) {
      errors.montant = `Le montant ne peut pas dépasser ${remaining.toLocaleString()} XOF`;
    }

    if (!formData.mode) {
      errors.mode = 'Le mode de paiement est obligatoire';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = (payslip) => {
    // Calculate remaining amount
    const totalPaid = payslip.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0;
    const remaining = payslip.salaireNet - totalPaid;
    setSelectedPayslip(payslip);
    setFormData({
      montant: remaining.toString(),
      mode: 'virement',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await paymentsAPI.create({
        payslipId: selectedPayslip.id,
        montant: parseFloat(formData.montant),
        mode: formData.mode,
      });
      setShowModal(false);
      resetForm();
      setFormErrors({});
      loadPayslips();
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      montant: '',
      mode: 'virement',
    });
    setSelectedPayslip(null);
    setFormErrors({});
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadReceipt = async (payslip) => {
    console.log('Tentative de téléchargement du reçu pour payslip:', payslip.id);
    // Find the latest payment for this payslip
    const latestPayment = payslip.paiements?.sort((a, b) => new Date(b.datePaiement) - new Date(a.datePaiement))[0];

    if (!latestPayment) {
      console.log('Aucun paiement trouvé');
      alert('Aucun paiement trouvé pour ce bulletin');
      return;
    }

    console.log('Paiement trouvé:', latestPayment.id);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3010/api';
    const downloadUrl = `${apiUrl}/paies/${latestPayment.id}/download`;
    console.log('URL de téléchargement:', downloadUrl);

    try {
      // Créer un lien temporaire pour le téléchargement
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      console.log('Réponse reçue:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur réponse:', errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      console.log('Blob créé, taille:', blob.size, 'type:', blob.type);

      if (blob.size === 0) {
        throw new Error('Le fichier PDF est vide');
      }

      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob);

      // Créer un lien temporaire et déclencher le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `recu_paiement_${latestPayment.id}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Reçu téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur téléchargement reçu:', error);
      alert(`Erreur lors du téléchargement du reçu: ${error.message}`);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Paiements
          </h1>
          <p className="text-secondary-600 dark:text-slate-300 mt-1">
            Gérez les paiements des bulletins de paie
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
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
            En attente ({payslips.filter(p => p.statut === 'en_attente' || p.statut === 'validé' || p.statut === 'verrouillé').length})
          </button>
          <button
            onClick={() => setActiveTab('partial')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'partial'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Partiels ({payslips.filter(p => p.statut === 'partiel').length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'paid'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Payés ({payslips.filter(p => p.statut === 'payé').length})
          </button>
        </nav>
      </div>

      {/* Table des paiements */}
      <Card>
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 dark:text-slate-300 mt-4">Chargement...</p>
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCardIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Aucun bulletin
              </h3>
              <p className="text-secondary-600 dark:text-slate-300">
                {activeTab === 'pending' ? 'Aucun bulletin en attente de paiement' :
                 activeTab === 'partial' ? 'Aucun bulletin partiellement payé' :
                 'Aucun bulletin payé'}
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
                        Montant
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
                    {filteredPayslips.map((payslip) => {
                      const totalPaid = payslip.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0;
                      const remaining = payslip.salaireNet - totalPaid;
                      return (
                        <tr key={payslip.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-secondary-900 dark:text-white">
                              {payslip.employe?.nomComplet}
                            </div>
                            <div className="text-sm text-secondary-500 dark:text-slate-300">
                              {payslip.employe?.poste}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                            {activeTab === 'paid' ? formatCurrency(payslip.salaireNet) :
                             `${formatCurrency(remaining)} restant (${formatCurrency(totalPaid)} payé)`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payslip.statut === 'en_attente' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              payslip.statut === 'validé' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              payslip.statut === 'verrouillé' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                              payslip.statut === 'partiel' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            }`}>
                              {payslip.statut === 'en_attente' ? 'En attente' :
                               payslip.statut === 'validé' ? 'Validé' :
                               payslip.statut === 'verrouillé' ? 'Verrouillé' :
                               payslip.statut === 'partiel' ? 'Partiel' : 'Payé'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {activeTab === 'paid' ? (
                              <Button onClick={() => handleDownloadReceipt(payslip)} size="sm" variant="outline">
                                Télécharger reçu
                              </Button>
                            ) : (
                              <Button onClick={() => handlePayment(payslip)} size="sm">
                                Payer
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

      {/* Modal de paiement */}
      {showModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
              Payer {selectedPayslip.employe?.nomComplet}
            </h2>
            <div className="mb-4 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
              <p className="text-sm text-secondary-600 dark:text-slate-300">
                Salaire net: {formatCurrency(selectedPayslip.salaireNet)}
              </p>
              <p className="text-sm text-secondary-600 dark:text-slate-300">
                Déjà payé: {formatCurrency(selectedPayslip.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0)}
              </p>
              <p className="text-sm font-medium text-secondary-900 dark:text-white">
                Restant à payer: {formatCurrency(parseFloat(formData.montant) || 0)}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Montant du paiement"
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleInputChange}
                error={formErrors.montant}
              />
              <Select
                label="Mode de paiement"
                name="mode"
                value={formData.mode}
                onChange={handleInputChange}
                error={formErrors.mode}
              >
                <option value="virement">Virement bancaire</option>
                <option value="especes">Espèces</option>
                <option value="orange_money">Orange Money</option>
                <option value="wave">Wave</option>
              </Select>
              <div className="flex space-x-2 pt-4">
                <Button type="submit">
                  Enregistrer le paiement
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

export default PaymentsPage;