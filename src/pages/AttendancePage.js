import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { attendanceAPI, employeesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { ClockIcon, CheckCircleIcon, UserIcon, MagnifyingGlassIcon, UserPlusIcon, DocumentChartBarIcon, CalendarDaysIcon, ArrowDownTrayIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

const AttendancePage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState('pointage');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeQRCode, setActiveQRCode] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadEmployees = useCallback(async () => {
    if (!user?.entrepriseId) {
      setEmployees([]);
      return;
    }

    try {
      const response = await employeesAPI.getAll({
        entrepriseId: user.entrepriseId,
        status: 'actif'
      });
      const employeeData = response.data?.data || response.data || [];
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (error) {
      setEmployees([]);
    }
  }, [user?.entrepriseId]);

  // Charger tous les pointages du jour pour l'entreprise
  const loadTodayAttendance = useCallback(async () => {
    if (!user?.entrepriseId) {
      setTodayAttendance([]);
      return;
    }

    try {
      // Pour le vigile, on charge tous les pointages de l'entreprise
      const response = await attendanceAPI.getCompanyTodayAttendance(user.entrepriseId);
      const attendanceData = response.data?.data || response.data || [];
      setTodayAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      setTodayAttendance([]);
    }
  }, [user?.entrepriseId]);

  // Charger les employés de l'entreprise du vigile
  useEffect(() => {
    loadEmployees();
    loadTodayAttendance();
  }, [loadEmployees, loadTodayAttendance]);

  // Filtrer les employés selon la recherche
  useEffect(() => {
    if (searchTerm && Array.isArray(employees)) {
      const filtered = employees.filter(employee =>
        employee.nomComplet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.poste?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(Array.isArray(employees) ? employees : []);
    }
  }, [searchTerm, employees]);

  // Vérifier le PIN et pointer
  const handleManualCheckIn = async () => {
    if (!selectedEmployee || !pinCode) {
      // Afficher un message d'erreur dans l'interface
      setErrorMessage('Veuillez sélectionner un employé et saisir le code PIN');
      return;
    }

    if (!Array.isArray(employees)) {
      setErrorMessage('Erreur: liste des employés non disponible');
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) {
      setErrorMessage('Employé non trouvé');
      return false;
    }

    // Vérifier le PIN (4 premiers chiffres du téléphone)
    const phoneStr = employee.telephone?.toString() || '';
    const cleanedPhone = phoneStr.replace(/\D/g, '');
    const expectedPin = cleanedPhone.substring(0, 4);

    if (pinCode !== expectedPin) {
      setErrorMessage('Code PIN incorrect');
      return false;
    }

    setLoading(true);
    setErrorMessage(''); // Clear any previous error
    try {
      await attendanceAPI.checkIn({
        employeId: selectedEmployee,
        type: 'entree',
        method: 'manual',
        location: null // Pointage manuel par vigile
      });

      setSuccessMessage(`Pointage réussi pour ${employee.nomComplet}`);
      loadTodayAttendance();
      // Reset form
      setSelectedEmployee('');
      setEmployeeName('');
      setPinCode('');
    } catch (error) {
      setErrorMessage('Erreur lors du pointage');
    } finally {
      setLoading(false);
    }
  };

  // Sélection rapide par nom
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee.id);
    setEmployeeName(employee.nomComplet);
  };

  // Générer le rapport de présence
  const generateAttendanceReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      setErrorMessage('Veuillez sélectionner les dates de début et fin');
      return;
    }

    if (!user?.entrepriseId) {
      setErrorMessage('Entreprise non trouvée');
      return;
    }

    setGeneratingReport(true);
    setErrorMessage('');
    try {
      const response = await attendanceAPI.getAttendanceReport(user.entrepriseId, reportStartDate, reportEndDate);
      setReportData(response.data.data || response.data);
      setSuccessMessage('Rapport généré avec succès');
    } catch (error) {
      setErrorMessage('Erreur lors de la génération du rapport');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Générer le QR code entreprise
  const generateCompanyQR = async () => {
    if (!user?.entrepriseId) {
      setErrorMessage('Entreprise non trouvée');
      return;
    }

    setGeneratingQR(true);
    setErrorMessage('');
    try {
      const response = await attendanceAPI.generateCompanyQRCode(user.entrepriseId);
      const qrData = response.data.data;
      setActiveQRCode(qrData);

      // Générer l'image QR code à partir de l'URL
      const qrCodeUrl = await QRCode.toDataURL(qrData.qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeImage(qrCodeUrl);
      setSuccessMessage('QR code généré avec succès');
    } catch (error) {
      setErrorMessage('Erreur lors de la génération du QR code entreprise');
    } finally {
      setGeneratingQR(false);
    }
  };

  // Exporter le rapport
  const exportReport = () => {
    if (!reportData) {
      setErrorMessage('Générez d\'abord un rapport');
      return;
    }

    // Créer un contenu CSV simple
    let csvContent = 'Employé,Date,Heure,Type,Méthode\n';

    reportData.attendances.forEach(attendance => {
      const employee = employees.find(emp => emp.id === attendance.employeId);
      const date = new Date(attendance.timestamp).toLocaleDateString('fr-FR');
      const time = new Date(attendance.timestamp).toLocaleTimeString('fr-FR');
      csvContent += `"${employee?.nomComplet || 'Inconnu'}","${date}","${time}","${attendance.type}","${attendance.method}"\n`;
    });

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_presence_${reportStartDate}_${reportEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Surveillance des Pointages
        </h1>
        <p className="text-secondary-600 dark:text-slate-300 mt-1">
          Gestion et rapports des présences des employés
        </p>
      </div>

      {/* Messages d'erreur et de succès */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Onglets */}
      <div className="border-b border-secondary-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pointage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pointage'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Pointage Manuel
          </button>
          <button
            onClick={() => setActiveTab('dynamique')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dynamique'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Pointage Dynamique
          </button>
          <button
            onClick={() => setActiveTab('rapports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rapports'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Rapports de Présence
          </button>
        </nav>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'dynamique' && (
        <div className="space-y-6">
          {/* Pointage Dynamique */}
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <QrCodeIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Pointage Dynamique</Card.Title>
                  <Card.Description>
                    Générez un QR code que les employés peuvent scanner pour pointer automatiquement
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="text-sm text-secondary-600 dark:text-slate-300">
                  <p>Ce QR code permet aux employés de votre entreprise de pointer en scannant le code avec leur téléphone.</p>
                  <p>Ils seront redirigés vers une page où ils pourront entrer leur code PIN pour valider leur pointage.</p>
                </div>

                {!activeQRCode ? (
                  <Button
                    onClick={generateCompanyQR}
                    disabled={generatingQR}
                    className="w-full"
                  >
                    {generatingQR ? 'Génération...' : 'Générer QR Code Entreprise'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-secondary-600 dark:text-slate-300 mb-4">
                        QR Code actif - Les employés peuvent scanner ce code:
                      </p>
                      {qrCodeImage && (
                        <div className="bg-white p-4 rounded-lg inline-block border-4 border-primary-200 dark:border-primary-800">
                          <img
                            src={qrCodeImage}
                            alt="QR Code Entreprise"
                            className="w-48 h-48"
                          />
                        </div>
                      )}
                      <p className="text-xs text-secondary-500 dark:text-slate-400 mt-4">
                        Expire le: {new Date(activeQRCode.expiresAt).toLocaleString('fr-FR')}
                      </p>
                      <p className="text-xs text-secondary-400 dark:text-slate-500 mt-2">
                        Code alternatif: {activeQRCode.qrCode.substring(0, 20)}...
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={generateCompanyQR}
                        disabled={generatingQR}
                        variant="outline"
                        className="flex-1"
                      >
                        Régénérer
                      </Button>
                      <Button
                        onClick={() => {
                          setActiveQRCode(null);
                          setQrCodeImage(null);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Désactiver
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Instructions pour les employés */}
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <UserIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <Card.Title>Instructions pour les employés</Card.Title>
                  <Card.Description>
                    Comment les employés utilisent le pointage dynamique
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400">1</span>
                  </div>
                  <p className="text-sm text-secondary-600 dark:text-slate-300">
                    Scanner le QR code affiché ci-dessus avec l'appareil photo de leur téléphone
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400">2</span>
                  </div>
                  <p className="text-sm text-secondary-600 dark:text-slate-300">
                    Sélectionner leur nom dans la liste des employés
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400">3</span>
                  </div>
                  <p className="text-sm text-secondary-600 dark:text-slate-300">
                    Entrer leur code PIN (4 premiers chiffres de leur numéro de téléphone)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400">4</span>
                  </div>
                  <p className="text-sm text-secondary-600 dark:text-slate-300">
                    Valider leur pointage GPS ou QR code
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {activeTab === 'pointage' && (
        <>
          {/* Pointage Manuel */}
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <UserPlusIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Pointage Manuel</Card.Title>
                  <Card.Description>
                    Enregistrez le pointage d'un employé en entrant son nom et code PIN
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
          <div className="space-y-4">
            {/* Recherche employé */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                Rechercher un employé
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                <Input
                  type="text"
                  placeholder="Nom ou poste de l'employé..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Liste des employés filtrés */}
            {searchTerm && Array.isArray(filteredEmployees) && filteredEmployees.length > 0 && (
              <div className="border border-secondary-200 dark:border-slate-600 rounded-lg max-h-40 overflow-y-auto">
                {filteredEmployees.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => handleEmployeeSelect(employee)}
                    className="w-full text-left p-3 hover:bg-secondary-50 dark:hover:bg-slate-700 border-b border-secondary-100 dark:border-slate-600 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <UserIcon className="w-5 h-5 text-secondary-400" />
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {employee.nomComplet}
                        </p>
                        <p className="text-sm text-secondary-600 dark:text-slate-300">
                          {employee.poste}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Formulaire de pointage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                  Employé sélectionné
                </label>
                <Input
                  value={employeeName}
                  readOnly
                  placeholder="Sélectionnez un employé ci-dessus"
                  className="bg-secondary-50 dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                  Code PIN (4 chiffres)
                </label>
                <Input
                  type="password"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="XXXX"
                  maxLength="4"
                />
              </div>
            </div>

              <Button
                onClick={handleManualCheckIn}
                disabled={!selectedEmployee || pinCode.length !== 4 || loading}
                className="w-full"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer le Pointage'}
              </Button>
            </div>
          </Card.Content>
        </Card>

      {/* Statistiques du jour */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <Card.Content className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {Array.isArray(employees) ? employees.length : 0}
            </div>
            <p className="text-secondary-600 dark:text-slate-300">Employés actifs</p>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Array.isArray(todayAttendance) ? todayAttendance.length : 0}
            </div>
            <p className="text-secondary-600 dark:text-slate-300">Pointages aujourd'hui</p>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Array.isArray(employees) && Array.isArray(todayAttendance)
                ? employees.length - new Set(todayAttendance.map(p => p.employeId)).size
                : 0}
            </div>
            <p className="text-secondary-600 dark:text-slate-300">Absents aujourd'hui</p>
          </Card.Content>
        </Card>
      </div>

      {/* Pointages du jour */}
      <Card>
        <Card.Header>
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-6 h-6 text-primary-dynamic" />
            <div>
              <Card.Title>Pointages du jour</Card.Title>
              <Card.Description>
                Tous les pointages enregistrés aujourd'hui
              </Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Aucun pointage aujourd'hui
              </h3>
              <p className="text-secondary-600 dark:text-slate-300">
                Les pointages apparaîtront ici au fur et à mesure
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(todayAttendance) && todayAttendance.map((attendance, index) => {
                const employee = Array.isArray(employees) ? employees.find(emp => emp.id === attendance.employeId) : null;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {employee?.nomComplet || 'Employé inconnu'}
                        </p>
                        <p className="text-sm text-secondary-600 dark:text-slate-300">
                          {new Date(attendance.timestamp).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                        {attendance.method}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Content>
      </Card>
        </>
      )}

      {/* Onglet Rapports de Présence */}
      {activeTab === 'rapports' && (
        <div className="space-y-6">
          {/* Générateur de rapports */}
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <DocumentChartBarIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Générer un Rapport de Présence</Card.Title>
                  <Card.Description>
                    Sélectionnez une période pour générer un rapport détaillé des présences
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                    Date de début
                  </label>
                  <Input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                    Date de fin
                  </label>
                  <Input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <Button
                    onClick={generateAttendanceReport}
                    disabled={generatingReport || !reportStartDate || !reportEndDate}
                    className="flex-1"
                  >
                    {generatingReport ? 'Génération...' : 'Générer le Rapport'}
                  </Button>
                  {reportData && (
                    <Button
                      onClick={exportReport}
                      variant="outline"
                      className="px-3"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Résultats du rapport */}
          {reportData && (
            <>
              {/* Statistiques du rapport */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <Card.Content className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {reportData.summary?.totalEmployees || 0}
                    </div>
                    <p className="text-secondary-600 dark:text-slate-300">Employés actifs</p>
                  </Card.Content>
                </Card>
                <Card>
                  <Card.Content className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.summary?.totalPresent || 0}
                    </div>
                    <p className="text-secondary-600 dark:text-slate-300">Jours de présence</p>
                  </Card.Content>
                </Card>
                <Card>
                  <Card.Content className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {reportData.summary?.totalAbsent || 0}
                    </div>
                    <p className="text-secondary-600 dark:text-slate-300">Jours d'absence</p>
                  </Card.Content>
                </Card>
                <Card>
                  <Card.Content className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.summary ? Math.round((reportData.summary.totalPresent / (reportData.summary.totalPresent + reportData.summary.totalAbsent)) * 100) || 0 : 0}%
                    </div>
                    <p className="text-secondary-600 dark:text-slate-300">Taux de présence</p>
                  </Card.Content>
                </Card>
              </div>

              {/* Détail par employé */}
              <Card>
                <Card.Header>
                  <div className="flex items-center space-x-3">
                    <CalendarDaysIcon className="w-6 h-6 text-primary-dynamic" />
                    <div>
                      <Card.Title>Détail par Employé</Card.Title>
                      <Card.Description>
                        Présence détaillée pour chaque employé sur la période sélectionnée
                      </Card.Description>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    {reportData.employeeDetails.map((employee, index) => (
                      <div key={index} className="border border-secondary-200 dark:border-slate-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-secondary-900 dark:text-white">
                            {employee.nomComplet}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-green-600">
                              {employee.presentDays} présents
                            </span>
                            <span className="text-red-600">
                              {employee.absentDays} absents
                            </span>
                            <span className="text-blue-600">
                              {Math.round((employee.presentDays / (employee.presentDays + employee.absentDays)) * 100) || 0}% présence
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {employee.dailyStatus.map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200 hover:scale-105 ${
                                day.status === 'present'
                                  ? 'bg-green-500 text-white border-green-600 shadow-sm'
                                  : 'bg-red-500 text-white border-red-600 shadow-sm'
                              }`}
                              title={`${day.date}: ${day.status === 'present' ? 'Présent' : 'Absent'}`}
                            >
                              {new Date(day.date).getDate()}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;