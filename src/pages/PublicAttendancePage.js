import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { attendanceAPI } from '../utils/api';
import { MapPinIcon, QrCodeIcon, ClockIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';

const PublicAttendancePage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('loading'); // 'loading', 'select', 'pin', 'pointage'
  const [qrCode, setQrCode] = useState(null);
  const [scannedQR, setScannedQR] = useState('');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fonction séparée pour valider les QR employés
  const validateEmployeeQR = useCallback(async (qrCode) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await attendanceAPI.validateQRCode(qrCode, currentLocation);
      setSuccessMessage('Pointage réussi !');
      // Pour les QR employés, on peut rester sur la page ou rediriger
      setStep('success');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la validation du QR code';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  // Traiter le QR code scanné
  const handleQRScan = useCallback((autoScan = false) => {
    if (!scannedQR.trim()) {
      if (!autoScan) {
        setErrorMessage('Veuillez entrer le code QR scanné');
      }
      return;
    }

    try {
      const qrData = JSON.parse(atob(scannedQR.trim()));

      // Vérifier l'expiration
      if (Date.now() > qrData.timestamp + (qrData.type === 'company_checkin' ? 60 * 60 * 1000 : 15 * 60 * 1000)) {
        setErrorMessage('Ce QR code a expiré');
        return;
      }

      // QR code entreprise (sélection employé)
      if (qrData.type === 'company_checkin' && qrData.entrepriseId) {
        setSelectedCompany(qrData.entrepriseId);
        loadEmployees(qrData.entrepriseId);
        setStep('select');
        // Si c'est un scan automatique, on ne montre pas de message d'erreur
        if (!autoScan) {
          setSuccessMessage('QR code validé ! Veuillez sélectionner votre nom.');
        }
      }
      // QR code employé (pointage direct)
      else if (qrData.type === 'checkin' && qrData.employeId) {
        // Pour les QR employés, on fait le pointage immédiatement
        validateEmployeeQR(scannedQR.trim());
      } else {
        if (!autoScan) {
          setErrorMessage('QR code invalide');
        }
      }
    } catch (error) {
      if (!autoScan) {
        setErrorMessage('QR code invalide');
      }
    }
  }, [scannedQR, validateEmployeeQR]);

  // Charger la liste des entreprises
  useEffect(() => {
    getCurrentLocation();

    // Vérifier si des données QR sont passées dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const qrData = urlParams.get('data');
    if (qrData) {
      setScannedQR(qrData);
      // Traiter immédiatement le QR sans setTimeout
      handleQRScan(true);
    }
  }, [handleQRScan]);

  const loadEmployees = async (companyId) => {
    if (!companyId) {
      return;
    }

    try {
      const url = `/api/employes/public?status=actif&limit=1000&entrepriseId=${companyId}`;
      const response = await fetch(url);
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (error) {
      setEmployees([]);
    }
  };

  // Obtenir la localisation GPS
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setErrorMessage('Impossible d\'obtenir votre position GPS. Le pointage sera limité.');
        }
      );
    } else {
      setErrorMessage('La géolocalisation n\'est pas supportée par ce navigateur.');
    }
  };

  // Vérifier le code PIN (simple pour démo - en production utiliser hash)
  const verifyPin = () => {
    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) {
      setErrorMessage('Employé non trouvé');
      return false;
    }

    // Pour la démo, PIN = 4 premiers chiffres du téléphone
    const expectedPin = employee.telephone?.substring(0, 4) || '0000';

    if (pinCode === expectedPin) {
      setStep('pointage');
      loadTodayAttendance();
      setErrorMessage(''); // Clear any previous error
      return true;
    } else {
      setErrorMessage('Code PIN incorrect');
      return false;
    }
  };

  // Charger les pointages du jour
  const loadTodayAttendance = async () => {
    if (!selectedEmployee) return;

    try {
      await attendanceAPI.getTodayAttendance(selectedEmployee).then(response => {
        setTodayAttendance(response.data.data || []);
      });
    } catch (error) {
    }
  };


  // Pointage GPS
  const handleGPSCheckIn = async () => {
    if (!currentLocation) {
      setErrorMessage('Localisation GPS requise pour le pointage');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      // Vérifier si l'employé peut pointer
      const canCheckInResponse = await attendanceAPI.canCheckIn(selectedEmployee, currentLocation.lat, currentLocation.lng);
      if (!canCheckInResponse.data.canCheckIn) {
        setErrorMessage(canCheckInResponse.data.reason || 'Pointage non autorisé');
        return;
      }

      await attendanceAPI.checkIn({
        employeId: selectedEmployee,
        type: 'entree',
        method: 'gps',
        location: currentLocation
      });

      setSuccessMessage('Pointage GPS réussi !');
      loadTodayAttendance();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors du pointage GPS';
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Générer QR Code
  const generateQRCode = async () => {
    try {
      await attendanceAPI.generateQRCode(selectedEmployee).then(response => {
        setQrCode(response.data.data.qrCode);
        setSuccessMessage('QR code généré');
      });
    } catch (error) {
      setErrorMessage('Erreur lors de la génération du QR code');
    }
  };

  // Simuler validation QR (en production utiliser caméra)
  const simulateQRValidation = async () => {
    if (!qrCode) {
      setErrorMessage('Générez d\'abord un QR code');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      // Vérifier si l'employé peut pointer
      const canCheckInResponse = await attendanceAPI.canCheckIn(selectedEmployee, currentLocation?.lat, currentLocation?.lng);
      if (!canCheckInResponse.data.canCheckIn) {
        setErrorMessage(canCheckInResponse.data.reason || 'Pointage non autorisé');
        return;
      }

      await attendanceAPI.validateQRCode(qrCode, currentLocation).then(response => {
        if (response.data.success) {
          setSuccessMessage('Pointage QR réussi !');
          loadTodayAttendance();
          setQrCode(null); // Reset QR
        } else {
          setErrorMessage('Erreur validation QR');
        }
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la validation du QR code';
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);


  // Afficher un message d'erreur si pas de QR data
  if (step === 'loading' && !scannedQR) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <QrCodeIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <Card.Title>Accès au pointage</Card.Title>
                  <Card.Description>
                    Scannez un QR code ou saisissez les données manuellement pour tester
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <Input
                  label="Code QR scanné"
                  type="text"
                  value={scannedQR}
                  onChange={(e) => setScannedQR(e.target.value)}
                  placeholder="Collez le code QR ici..."
                />

                <div className="text-sm text-gray-600">
                  <p>Pour tester : générez un QR code depuis votre page admin, copiez le code qui apparaît sous "Code alternatif", et collez-le ici.</p>
                </div>

                <Button
                  onClick={() => {
                    if (scannedQR.trim()) {
                      handleQRScan(false);
                    }
                  }}
                  disabled={!scannedQR.trim()}
                  className="w-full"
                >
                  Valider QR Code
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <ClockIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pointage Employés
          </h1>
          <p className="text-gray-600">
            Système de pointage automatisé et sécurisé
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Debug: step={step}, employees={employees.length}, company={selectedCompany}
          </p>
        </div>

        {/* Messages d'erreur et de succès */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}



        {/* Étape 2: Sélection employé */}
        {step === 'select' && (
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center space-x-3">
                <UserIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <Card.Title>Sélectionner votre nom</Card.Title>
                  <Card.Description>
                    Choisissez votre nom dans la liste des employés
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">-- Choisir un employé --</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.nomComplet} - {employee.poste}
                    </option>
                  ))}
                </Select>

                <Button
                  onClick={() => setStep('pin')}
                  disabled={!selectedEmployee}
                  className="w-full"
                >
                  Continuer
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Étape 2: Code PIN */}
        {step === 'pin' && (
          <Card className="mb-6">
            <Card.Header>
              <div>
                <Card.Title>Vérification d'identité</Card.Title>
                <Card.Description>
                  Employé: <strong>{selectedEmployeeData?.nomComplet}</strong>
                </Card.Description>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <Input
                  label="Code PIN (4 chiffres)"
                  type="password"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Entrez votre code PIN"
                  maxLength="4"
                />

                <div className="flex space-x-2">
                  <Button
                    onClick={() => setStep('scan')}
                    variant="outline"
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={verifyPin}
                    disabled={pinCode.length !== 4}
                    className="flex-1"
                  >
                    Valider
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Étape 3: Pointage */}
        {step === 'pointage' && (
          <>
            {/* Méthodes de pointage */}
            <div className="space-y-6 mb-6">
              {/* Pointage GPS */}
              <Card>
                <Card.Header>
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="w-6 h-6 text-green-600" />
                    <div>
                      <Card.Title>Pointage GPS</Card.Title>
                      <Card.Description>
                        Pointage automatique avec vérification de localisation
                      </Card.Description>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <p>Localisation actuelle:</p>
                      {currentLocation ? (
                        <p className="font-mono text-xs">
                          {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                        </p>
                      ) : (
                        <p className="text-red-500">Non obtenue</p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={getCurrentLocation}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Actualiser GPS
                      </Button>
                      <Button
                        onClick={handleGPSCheckIn}
                        disabled={!currentLocation || loading}
                        className="flex-1"
                      >
                        {loading ? 'Pointage...' : 'Pointer (GPS)'}
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              {/* Pointage QR Code */}
              <Card>
                <Card.Header>
                  <div className="flex items-center space-x-3">
                    <QrCodeIcon className="w-6 h-6 text-purple-600" />
                    <div>
                      <Card.Title>Pointage QR Code</Card.Title>
                      <Card.Description>
                        Générez un QR code pour le pointage rapide
                      </Card.Description>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <Button onClick={generateQRCode} className="w-full">
                      Générer QR Code
                    </Button>

                    {qrCode && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Scannez ce QR code:
                        </p>
                        <div className="bg-white p-4 rounded-lg inline-block border-2 border-gray-200">
                          <div className="text-xs font-mono break-all max-w-xs">
                            {qrCode}
                          </div>
                        </div>
                        <br />
                        <Button
                          onClick={simulateQRValidation}
                          disabled={loading}
                          className="mt-2"
                          size="sm"
                        >
                          {loading ? 'Validation...' : 'Simuler Scan QR'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Historique du jour */}
            <Card>
              <Card.Header>
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <Card.Title>Pointages du jour</Card.Title>
                    <Card.Description>
                      Historique de vos pointages aujourd'hui
                    </Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                {todayAttendance.length === 0 ? (
                  <div className="text-center py-8">
                    <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun pointage aujourd'hui
                    </h3>
                    <p className="text-gray-600">
                      Utilisez une des méthodes ci-dessus pour pointer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAttendance.map((attendance, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {attendance.type}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(attendance.timestamp).toLocaleTimeString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            attendance.method === 'gps'
                              ? 'bg-green-100 text-green-800'
                              : attendance.method === 'qr'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {attendance.method.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Bouton retour */}
            <div className="mt-6">
              <Button
                onClick={() => {
                  setStep('scan');
                  setSelectedEmployee('');
                  setPinCode('');
                  setQrCode(null);
                  setTodayAttendance([]);
                  setScannedQR('');
                }}
                variant="outline"
                className="w-full"
              >
                Nouveau pointage
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicAttendancePage;