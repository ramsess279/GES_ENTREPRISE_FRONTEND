import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ArrowLeftIcon, PencilIcon, CheckCircleIcon, CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { payrunsAPI, payslipsAPI, paymentsAPI, employeesAPI } from '../utils/api';

const PayRunDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    montant: '',
    mode: 'virement',
  });

  useEffect(() => {
    const fetchPayrunDetails = async () => {
      try {
        setLoading(true);

        // Charger les détails du cycle
        const payrunResponse = await payrunsAPI.getById(id);
        setPayrun(payrunResponse.data);

        // Charger les bulletins du cycle
        const payslipsResponse = await payslipsAPI.getByPayrun(id);
        setPayslips(payslipsResponse.data.data || []);

      } catch (err) {
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayrunDetails();
    }
  }, [id]);

  const handleApprovePayrun = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir approuver ce cycle de paie ? Les bulletins ne pourront plus être modifiés.')) {
      try {
        await payrunsAPI.approve(id);
        // Recharger les données
        const payrunResponse = await payrunsAPI.getById(id);
        setPayrun(payrunResponse.data);
        alert('Cycle de paie approuvé avec succès');
      } catch (error) {
        alert('Erreur lors de l\'approbation du cycle');
      }
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState(null);
  const [editForm, setEditForm] = useState({
    nombreJour: '',
    nombreHeure: '',
    deductions: '',
    honoraires: '',
    salaireBase: '',
    poste: '',
    situationMatrimoniale: '',
    nationalite: '',
    email: '',
    telephone: '',
    coordonneeBancaire: '',
  });

  // Calculer le salaire en temps réel
  const calculatedSalary = useMemo(() => {
    if (!editingPayslip?.employe) return { brut: editingPayslip?.salaireBrut || 0, net: editingPayslip?.salaireNet || 0 };

    const employee = editingPayslip.employe;
    const payRun = editingPayslip.payRun;
    let salaireBrut = editingPayslip.salaireBrut;

    const nombreJour = parseFloat(editForm.nombreJour) || 0;
    const nombreHeure = parseFloat(editForm.nombreHeure) || 0;
    const deductions = parseFloat(editForm.deductions) || editingPayslip.deductions || 0;
    const hasValidJour = editForm.nombreJour && !isNaN(parseFloat(editForm.nombreJour)) && nombreJour > 0;
    const hasValidHeure = editForm.nombreHeure && !isNaN(parseFloat(editForm.nombreHeure)) && nombreHeure > 0;

    if (employee.typeContrat === 'journalier') {
      if (payRun?.type === 'journaliere' && hasValidJour) {
        salaireBrut = employee.salaireBase * nombreJour;
      } else if (hasValidHeure) {
        salaireBrut = employee.salaireBase * nombreHeure;
      }
    } else if (employee.typeContrat === 'honoraire' && hasValidHeure) {
      salaireBrut = employee.salaireBase * nombreHeure;
    }

    const salaireNet = salaireBrut - deductions;
    return { brut: salaireBrut, net: salaireNet };
  }, [editingPayslip, editForm.nombreJour, editForm.nombreHeure, editForm.deductions]);

  const handleEditPayslip = (payslip) => {
    setEditingPayslip(payslip);
    setEditForm({
      nombreJour: payslip.nombreJour?.toString() || '',
      nombreHeure: payslip.nombreHeure?.toString() || '',
      deductions: payslip.deductions?.toString() || '',
      honoraires: payslip.employe?.salaireBase?.toString() || '',
      salaireBase: payslip.employe?.salaireBase?.toString() || '',
      poste: payslip.employe?.poste || '',
      situationMatrimoniale: payslip.employe?.situationMatrimoniale || '',
      nationalite: payslip.employe?.nationalite || '',
      email: payslip.employe?.email || '',
      telephone: payslip.employe?.telephone || '',
      coordonneeBancaire: payslip.employe?.coordonneeBancaire || '',
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      // Mettre à jour les informations du bulletin (jours/heures)
      const payslipUpdateData = {};
      if (editForm.nombreJour) payslipUpdateData.nombreJour = parseInt(editForm.nombreJour);
      if (editForm.nombreHeure) payslipUpdateData.nombreHeure = parseInt(editForm.nombreHeure);

      // Recalculer le salaire si les heures/jours ou déductions ont changé
      const employee = editingPayslip.employe;
      const payRun = editingPayslip.payRun;
      const deductions = parseFloat(editForm.deductions) || 0;

      if (employee?.typeContrat === 'journalier') {
        if (payRun?.type === 'journaliere' && editForm.nombreJour) {
          // Pour journaliers dans cycle journalier : salaire basé sur jours
          payslipUpdateData.salaireBrut = employee.salaireBase * parseInt(editForm.nombreJour);
        } else if (editForm.nombreHeure) {
          // Pour journaliers dans cycle horaire : salaire basé sur heures
          payslipUpdateData.salaireBrut = employee.salaireBase * parseInt(editForm.nombreHeure);
        }
      } else if (employee?.typeContrat === 'honoraire' && editForm.nombreHeure) {
        // Pour honoraires : salaire basé sur heures
        payslipUpdateData.salaireBrut = employee.salaireBase * parseInt(editForm.nombreHeure);
      }

      // Mettre à jour les déductions si modifiées
      if (editForm.deductions !== '' && parseFloat(editForm.deductions) !== editingPayslip.deductions) {
        payslipUpdateData.deductions = deductions;
      }

      // Recalculer le salaire net (salaire brut - déductions)
      if (payslipUpdateData.salaireBrut !== undefined || payslipUpdateData.deductions !== undefined) {
        const finalBrut = payslipUpdateData.salaireBrut !== undefined ? payslipUpdateData.salaireBrut : editingPayslip.salaireBrut;
        const finalDeductions = payslipUpdateData.deductions !== undefined ? payslipUpdateData.deductions : (editingPayslip.deductions || 0);
        payslipUpdateData.salaireNet = finalBrut - finalDeductions;
      }

      if (Object.keys(payslipUpdateData).length > 0) {
        await payslipsAPI.update(editingPayslip.id, payslipUpdateData);
      }

      // Mettre à jour les informations de l'employé
      const employeUpdateData = {};
      // Pour les employés journaliers dans un cycle journalier, utiliser les honoraires comme salaire de base
      if (editingPayslip.employe?.typeContrat === 'journalier' && editingPayslip.payRun?.type === 'journaliere' && editForm.honoraires) {
        employeUpdateData.salaireBase = parseFloat(editForm.honoraires);
      } else if (editForm.salaireBase) {
        employeUpdateData.salaireBase = parseFloat(editForm.salaireBase);
      }
      if (editForm.poste) employeUpdateData.poste = editForm.poste;
      if (editForm.situationMatrimoniale) employeUpdateData.situationMatrimoniale = editForm.situationMatrimoniale;
      if (editForm.nationalite) employeUpdateData.nationalite = editForm.nationalite;
      if (editForm.email) employeUpdateData.email = editForm.email;
      if (editForm.telephone) employeUpdateData.telephone = editForm.telephone;
      if (editForm.coordonneeBancaire) employeUpdateData.coordonneeBancaire = editForm.coordonneeBancaire;

      if (Object.keys(employeUpdateData).length > 0) {
        await employeesAPI.update(editingPayslip.employe.id, employeUpdateData);
      }

      // Recharger les bulletins
      const payslipsResponse = await payslipsAPI.getByPayrun(id);
      setPayslips(payslipsResponse.data.data || []);

      setShowEditModal(false);
      setEditingPayslip(null);
      alert('Informations modifiées avec succès');
    } catch (error) {
      alert(`Erreur lors de la modification des informations: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleValidatePayslip = async (payslip) => {
    if (window.confirm(`Êtes-vous sûr de vouloir valider le bulletin de ${payslip.employe?.nomComplet} ?`)) {
      try {
        await payslipsAPI.update(payslip.id, { statut: 'validé' });
        // Recharger les bulletins
        const payslipsResponse = await payslipsAPI.getByPayrun(id);
        setPayslips(payslipsResponse.data.data || []);
        alert('Bulletin validé avec succès');
      } catch (error) {
        alert('Erreur lors de la validation du bulletin');
      }
    }
  };

  const handleGeneratePayslips = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir générer les bulletins de paie pour ce cycle ?')) {
      try {
        await payrunsAPI.generatePayslips(id);
        // Recharger les bulletins
        const payslipsResponse = await payslipsAPI.getByPayrun(id);
        setPayslips(payslipsResponse.data.data || []);
        alert('Bulletins générés avec succès');
      } catch (error) {
        alert('Erreur lors de la génération des bulletins');
      }
    }
  };

  const handlePayment = (payslip) => {
    setSelectedPayslip(payslip);
    setPaymentForm({
      montant: payslip.salaireNet?.toString() || '',
      mode: 'virement',
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      await paymentsAPI.create({
        payslipId: selectedPayslip.id,
        montant: parseFloat(paymentForm.montant),
        mode: paymentForm.mode,
      });

      // Recharger les bulletins
      const payslipsResponse = await payslipsAPI.getByPayrun(id);
      setPayslips(payslipsResponse.data.data || []);

      setShowPaymentModal(false);
      setSelectedPayslip(null);
      alert('Paiement enregistré avec succès');
    } catch (error) {
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPayslipStatusColor = (statut) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-4">Erreur</div>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">{error}</p>
          <Button onClick={() => navigate('/payruns')}>
            Retour aux cycles de paie
          </Button>
        </div>
      </div>
    );
  }

  if (!payrun) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">Cycle de paie non trouvé</p>
          <Button onClick={() => navigate('/payruns')}>
            Retour aux cycles de paie
          </Button>
        </div>
      </div>
    );
  }

  // Calculs des statistiques
  const totalBrut = payslips.reduce((sum, p) => sum + (p.salaireBrut || 0), 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + (p.deductions || 0), 0);
  const totalNet = payslips.reduce((sum, p) => sum + (p.salaireNet || 0), 0);
  const payesCount = payslips.filter(p => p.statut === 'payé').length;
  const partielsCount = payslips.filter(p => p.statut === 'partiel').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/payruns')}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Cycle: {payrun.periode}
            </h1>
            <p className="text-secondary-600 dark:text-slate-300">
              Gestion des bulletins et paiements
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          {payslips.length === 0 && (
            <Button onClick={handleGeneratePayslips}>
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Générer les bulletins
            </Button>
          )}
          {payrun.statut === 'brouillon' && payslips.length > 0 && (
            <Button onClick={handleApprovePayrun}>
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Approuver le cycle
            </Button>
          )}
          {payrun.statut === 'approuvé' && (
            <div className="text-sm text-green-600 dark:text-green-400">
              ✅ Cycle approuvé - Bulletins payables
            </div>
          )}
        </div>
      </div>

      {/* Statistiques - Disposition horizontale */}
      <Card>
        <Card.Header>
          <Card.Title>Statistiques du cycle</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
              <div className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
                {payslips.length}
              </div>
              <div className="text-sm text-secondary-600 dark:text-slate-300 font-medium">
                Bulletins totaux
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {payesCount}
              </div>
              <div className="text-sm text-secondary-600 dark:text-slate-300 font-medium">
                Bulletins payés
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {partielsCount}
              </div>
              <div className="text-sm text-secondary-600 dark:text-slate-300 font-medium">
                Paiements partiels
              </div>
            </div>
            <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {formatCurrency(totalNet)}
              </div>
              <div className="text-sm text-secondary-600 dark:text-slate-300 font-medium">
                Montant total net
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Informations du cycle */}
      <Card>
        <Card.Header>
          <Card.Title>Informations du cycle</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Période
              </label>
              <p className="text-secondary-900 dark:text-white font-medium">{payrun.periode}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Type de cycle
              </label>
              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                {payrun.type}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Statut
              </label>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                payrun.statut === 'brouillon'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : payrun.statut === 'approuvé'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {payrun.statut}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Date création
              </label>
              <p className="text-secondary-900 dark:text-white">{formatDate(payrun.dateCreation)}</p>
            </div>
            {payrun.dateDebut && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Date début
                </label>
                <p className="text-secondary-900 dark:text-white">{formatDate(payrun.dateDebut)}</p>
              </div>
            )}
            {payrun.dateFin && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Date fin
                </label>
                <p className="text-secondary-900 dark:text-white">{formatDate(payrun.dateFin)}</p>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Liste des bulletins */}
      <Card>
        <Card.Header>
          <Card.Title>Bulletins de paie ({payslips.length})</Card.Title>
          <Card.Description>
            Total brut: {formatCurrency(totalBrut)} |
            Total déductions: {formatCurrency(totalDeductions)} |
            Total net: {formatCurrency(totalNet)}
          </Card.Description>
        </Card.Header>
        <Card.Content className="p-0">
          {payslips.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Aucun bulletin
              </h3>
              <p className="text-secondary-600 dark:text-slate-300">
                Aucun employé actif trouvé pour ce cycle
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50 dark:bg-secondary-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                      Type contrat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                      Jours/Heures
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                      Brut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                      Déductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-slate-300 uppercase tracking-wider">
                      Net
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
                  {payslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900 dark:text-white">
                          {payslip.employe?.nomComplet}
                        </div>
                        <div className="text-sm text-secondary-500 dark:text-slate-300">
                          {payslip.employe?.poste}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 capitalize">
                          {payslip.employe?.typeContrat}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {payslip.employe?.typeContrat === 'journalier'
                          ? payslip.payRun?.type === 'journaliere'
                            ? `${payslip.nombreJour || 0} jours`
                            : `${payslip.nombreHeure || 0} heures`
                          : 'Salaire fixe'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {formatCurrency(payslip.salaireBrut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {formatCurrency(payslip.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {formatCurrency(payslip.salaireNet)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPayslipStatusColor(payslip.statut)}`}>
                          {payslip.statut.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {payrun.statut !== 'approuvé' && payslip.statut === 'en_attente' && (
                            <button
                              onClick={() => handleValidatePayslip(payslip)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Valider le bulletin"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                          {payrun.statut !== 'approuvé' && (
                            <button
                              onClick={() => handleEditPayslip(payslip)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Modifier jours/heures"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {payrun.statut === 'approuvé' && payslip.statut === 'validé' && payslip.statut !== 'payé' && (
                            <button
                              onClick={() => handlePayment(payslip)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Enregistrer paiement"
                            >
                              <CurrencyDollarIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Modal d'édition complète */}
      {showEditModal && editingPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">
              Modifier les informations de {editingPayslip.employe?.nomComplet}
            </h2>

            <form onSubmit={handleSubmitEdit} className="space-y-6">
              {/* Section Informations du bulletin */}
              <div className="bg-secondary-50 dark:bg-secondary-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-white">
                  📄 Informations du bulletin
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-secondary-800 rounded border">
                    <div className="text-sm text-secondary-600 dark:text-slate-300">Salaire brut</div>
                    <div className="text-lg font-semibold text-secondary-900 dark:text-white">
                      {formatCurrency(calculatedSalary.brut)}
                    </div>
                    {(calculatedSalary.brut !== editingPayslip.salaireBrut) && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Ancien: {formatCurrency(editingPayslip.salaireBrut)}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white dark:bg-secondary-800 rounded border">
                    <div className="text-sm text-secondary-600 dark:text-slate-300">Salaire net</div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(calculatedSalary.net)}
                    </div>
                    {(calculatedSalary.net !== editingPayslip.salaireNet) && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Ancien: {formatCurrency(editingPayslip.salaireNet)}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white dark:bg-secondary-800 rounded border">
                    <div className="text-sm text-secondary-600 dark:text-slate-300">Déductions</div>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(parseFloat(editForm.deductions) || editingPayslip.deductions || 0)}
                    </div>
                    {(parseFloat(editForm.deductions) !== editingPayslip.deductions && editForm.deductions !== '') && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Ancien: {formatCurrency(editingPayslip.deductions)}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white dark:bg-secondary-800 rounded border">
                    <div className="text-sm text-secondary-600 dark:text-slate-300">Type de contrat</div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 capitalize">
                      {editingPayslip.employe?.typeContrat}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {editingPayslip.employe?.typeContrat === 'journalier' ? (
                      editingPayslip.payRun?.type === 'journaliere' ? (
                        <>
                          <Input
                            label="Nombre de jours travaillés"

                            name="nombreJour"
                            value={editForm.nombreJour}
                            onChange={(e) => setEditForm(prev => ({ ...prev, nombreJour: e.target.value }))}
                            min="0"

                          />
                          <Input
                            label="Honoraires par jour (FCFA)"

                            name="honoraires"
                            value={editForm.honoraires || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, honoraires: e.target.value }))}
                            min="0"
                            placeholder="Ex: 25000"
                          />
                        </>
                      ) : (
                        <Input
                          label="Nombre d'heures travaillées"

                          name="nombreHeure"
                          value={editForm.nombreHeure}
                          onChange={(e) => setEditForm(prev => ({ ...prev, nombreHeure: e.target.value }))}
                          min="0"
                          step="0.5"

                        />
                      )
                    ) : editingPayslip.employe?.typeContrat === 'cdd' || editingPayslip.employe?.typeContrat === 'cdi' ? (
                      <div className="md:col-span-2 text-center py-4 text-secondary-500 dark:text-slate-400 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                        <div className="text-sm">
                          Pour les contrats {editingPayslip.employe?.typeContrat.toUpperCase()}, seules les informations personnelles et coordonnées peuvent être modifiées.
                        </div>
                        <div className="text-xs mt-1">
                          Les salaires sont calculés automatiquement selon le salaire de base, peu importe le type de cycle.
                        </div>
                      </div>
                    ) : (
                      <Input
                        label="Nombre d'heures travaillées"

                        name="nombreHeure"
                        value={editForm.nombreHeure}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nombreHeure: e.target.value }))}
                        min="0"
                        step="0.5"

                      />
                    )}

                    {/* Champ pour les déductions - toujours affiché */}
                    <Input
                      label="Déductions (FCFA)"

                      name="deductions"
                      value={editForm.deductions}
                      onChange={(e) => setEditForm(prev => ({ ...prev, deductions: e.target.value }))}
                      min="0"
                      placeholder="Ex: 5000"
                    />
                  </div>
                </div>
              </div>

              {/* Section Informations personnelles */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-white">
                  👤 Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Poste"
                    name="poste"
                    value={editForm.poste}
                    onChange={(e) => setEditForm(prev => ({ ...prev, poste: e.target.value }))}
                    placeholder="Ex: Développeur"
                  />
                  <Input
                    label="Situation matrimoniale"
                    name="situationMatrimoniale"
                    value={editForm.situationMatrimoniale}
                    onChange={(e) => setEditForm(prev => ({ ...prev, situationMatrimoniale: e.target.value }))}
                    placeholder="Ex: Célibataire, Marié(e)"
                  />
                  <Input
                    label="Nationalité"
                    name="nationalite"
                    value={editForm.nationalite}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nationalite: e.target.value }))}
                    placeholder="Ex: Sénégalaise"
                  />
                  <Input
                    label="Salaire de base (FCFA)"
                    
                    name="salaireBase"
                    value={editForm.salaireBase}
                    onChange={(e) => setEditForm(prev => ({ ...prev, salaireBase: e.target.value }))}
                    min="0"
                    placeholder="Ex: 500000"
                  />
                </div>
              </div>

              {/* Section Coordonnées */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-white">
                  📞 Coordonnées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    
                    name="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="exemple@email.com"
                  />
                  <Input
                    label="Téléphone"
                    name="telephone"
                    value={editForm.telephone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, telephone: e.target.value }))}
                    placeholder="+221 XX XXX XX XX"
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Coordonnées bancaires"
                      name="coordonneeBancaire"
                      value={editForm.coordonneeBancaire}
                      onChange={(e) => setEditForm(prev => ({ ...prev, coordonneeBancaire: e.target.value }))}
                      placeholder="IBAN, numéro de compte, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Section Demandes d'avance (temporairement vide) */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-white">
                  💰 Demandes d'avance
                </h3>
                <div className="text-center py-8 text-secondary-500 dark:text-slate-400">
                  <div className="text-sm">
                    Fonctionnalité de demandes d'avance à implémenter
                  </div>
                  <div className="text-xs mt-1">
                    Cette section sera disponible dans une future mise à jour
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                <Button type="submit" className="flex-1">
                  Enregistrer toutes les modifications
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPayslip(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de paiement */}
      {showPaymentModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
              Paiement pour {selectedPayslip.employe?.nomComplet}
            </h2>
            <div className="mb-4 p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
              <div className="text-sm text-secondary-600 dark:text-slate-300">
                Montant dû: <span className="font-medium text-secondary-900 dark:text-white">{formatCurrency(selectedPayslip.salaireNet)}</span>
              </div>
            </div>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <Input
                label="Montant"
                
                name="montant"
                value={paymentForm.montant}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, montant: e.target.value }))}
               
              />
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Mode de paiement
                </label>
                <select
                  name="mode"
                  value={paymentForm.mode}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white"
                 
                >
                  <option value="virement">Virement bancaire</option>
                  <option value="especes">Espèces</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="wave">Wave</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit">
                  Enregistrer le paiement
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

export default PayRunDetailsPage;