import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ArrowLeftIcon, PencilIcon, TrashIcon, CheckIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { companiesAPI, usersAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const CompanyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSuperAdmin, switchCompany } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPlainPassword, setShowPlainPassword] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await companiesAPI.getById(id);
        const data = response.data;

        // Mapper les données backend vers le format frontend
        const mappedCompany = {
          id: data.id,
          name: data.nom || '',
          email: data.email || '',
          phone: data.telephone || '',
          employees: 0, // À calculer plus tard depuis les employés
          status: 'active', // À ajouter au backend
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('fr-FR') : '',
          logo: data.logoUrl ? (data.logoUrl.startsWith('http') ? data.logoUrl : `${(process.env.REACT_APP_API_URL || 'http://localhost:3010/api').replace('/api', '')}${data.logoUrl}`) : null,
          couleurPrincipale: data.couleurPrimaire || '#0ea5e9',
          couleurSecondaire: data.couleurSecondaire || '#94a3b8',
          address: data.adresse || '',
          website: '', // Non disponible dans le backend
          subscription: {
            plan: 'Premium', // À ajouter au backend
            status: 'active', // À ajouter au backend
            nextPayment: '2024-10-15', // À ajouter au backend
            amount: '50,000 FCFA' // À ajouter au backend
          }
        };

        setCompany(mappedCompany);
        setEditForm(mappedCompany);
      } catch (err) {
        setError('Erreur lors du chargement des données de l\'entreprise');
      } finally {
        setLoading(false);
      }
    };

    const fetchAdminUser = async () => {
      try {
        const response = await usersAPI.getAdminByEntrepriseId(id);
        if (response.data) {
          setAdminUser(response.data);
        }
      } catch (err) {
        // Ne pas afficher d'erreur si pas d'admin trouvé
      }
    };

    if (id) {
      fetchCompany();
      fetchAdminUser();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      const formData = new FormData();

      // Ajouter les champs texte
      formData.append('nom', editForm.name || '');
      formData.append('email', editForm.email || '');
      formData.append('telephone', editForm.phone || '');
      formData.append('adresse', editForm.address || '');
      formData.append('couleurPrimaire', editForm.couleurPrincipale || '#0ea5e9');
      formData.append('couleurSecondaire', editForm.couleurSecondaire || '#94a3b8');

      // Ajouter le fichier logo si sélectionné
      if (selectedLogo) {
        formData.append('logo', selectedLogo);
      }

      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3010/api').replace('/api', '');
      const result = await companiesAPI.update(id, formData);

      // Mettre à jour l'état local avec les nouvelles données
      const updatedCompany = {
        ...editForm,
        logo: result.data.logoUrl ? (result.data.logoUrl.startsWith('http') ? result.data.logoUrl : `${baseUrl}${result.data.logoUrl}`) : editForm.logo,
      };

      setCompany(updatedCompany);
      setSelectedLogo(null);
      setIsEditing(false);
      alert(`Entreprise ${editForm.name} mise à jour avec succès`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert(`Erreur lors de la mise à jour de l'entreprise: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action est irréversible.')) {
      try {
        await companiesAPI.delete(id);
        alert('Entreprise supprimée avec succès');
        navigate('/companies');
      } catch (error) {
        alert('Erreur lors de la suppression de l\'entreprise');
      }
    }
  };

  const handleToggleStatus = () => {
    // Logic to toggle status
    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    alert(`Entreprise ${newStatus === 'active' ? 'activée' : 'désactivée'}`);
  };

  const handleSwitchCompany = async () => {
    try {
      const result = await switchCompany(id);
      if (result.success) {
        // Rediriger vers le dashboard de l'entreprise
        navigate('/dashboard');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert('Erreur lors du changement d\'entreprise');
    }
  };

  const handleChangeAdminPassword = async () => {
    if (!adminPassword.trim()) {
      alert('Veuillez saisir un nouveau mot de passe');
      return;
    }

    try {
      await usersAPI.changePassword(adminUser.id, { motDePasse: adminPassword });
      alert('Mot de passe modifié avec succès');
      setAdminPassword('');
      setShowPasswordChange(false);
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      alert('Erreur lors du changement de mot de passe');
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
          <Button onClick={() => navigate('/companies')}>
            Retour aux entreprises
          </Button>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">Entreprise non trouvée</p>
          <Button onClick={() => navigate('/companies')}>
            Retour aux entreprises
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      style={company?.couleurPrincipale ? {
        '--company-primary': company.couleurPrincipale
      } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/companies')}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              {company.name}
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Détails et gestion de l'entreprise
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(company);
                  setSelectedLogo(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <CheckIcon className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)}>
                <PencilIcon className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              {isSuperAdmin && user?.entrepriseId !== id && (
                <Button
                  variant="outline"
                  onClick={handleSwitchCompany}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Se connecter à l'entreprise
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo et Branding */}
        <div className="lg:col-span-1">
          <Card>
            <Card.Header>
              <Card.Title>Logo et Branding</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {/* Logo */}
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto bg-secondary-100 dark:bg-secondary-700 rounded-lg flex items-center justify-center mb-4">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={`Logo ${company.name}`}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-secondary-400 text-sm">Aucun logo</span>
                    )}
                  </div>
                  {isEditing && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedLogo(e.target.files[0])}
                      className="text-sm text-secondary-600 dark:text-secondary-400"
                    />
                  )}
                </div>

                {/* Couleurs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Couleur principale
                    </label>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded border border-secondary-300 dark:border-secondary-600"
                        style={{ backgroundColor: company.couleurPrincipale }}
                      ></div>
                      {isEditing ? (
                        <input
                          type="color"
                          value={editForm.couleurPrincipale}
                          onChange={(e) => setEditForm({...editForm, couleurPrincipale: e.target.value})}
                          className="w-16 h-8 rounded border border-secondary-300 dark:border-secondary-600"
                        />
                      ) : (
                        <span className="text-secondary-900 dark:text-secondary-100">{company.couleurPrincipale}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Couleur secondaire
                    </label>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded border border-secondary-300 dark:border-secondary-600"
                        style={{ backgroundColor: company.couleurSecondaire }}
                      ></div>
                      {isEditing ? (
                        <input
                          type="color"
                          value={editForm.couleurSecondaire}
                          onChange={(e) => setEditForm({...editForm, couleurSecondaire: e.target.value})}
                          className="w-16 h-8 rounded border border-secondary-300 dark:border-secondary-600"
                        />
                      ) : (
                        <span className="text-secondary-900 dark:text-secondary-100">{company.couleurSecondaire}</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Aperçu du thème */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                    Aperçu du thème
                  </label>
                  <div 
                    className="p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: company.couleurPrincipale + '10',
                      borderColor: company.couleurPrincipale + '30'
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: company.couleurPrincipale }}
                      ></div>
                      <span className="font-medium text-secondary-900 dark:text-secondary-100">
                        Dashboard {company.name}
                      </span>
                    </div>
                    <div className="text-xs text-secondary-600 dark:text-secondary-400">
                      Aperçu de l'interface utilisateur personnalisée
                    </div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Informations principales */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title>Informations de l'entreprise</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Nom de l'entreprise
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  ) : (
                    <p className="text-secondary-900 dark:text-secondary-100 text-lg font-medium">{company.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    />
                  ) : (
                    <p className="text-secondary-900 dark:text-secondary-100">{company.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Téléphone
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    />
                  ) : (
                    <p className="text-secondary-900 dark:text-secondary-100">{company.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Site web
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                    />
                  ) : (
                    <p className="text-secondary-900 dark:text-secondary-100">{company.website}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Nombre d'employés
                  </label>
                  {isEditing ? (
                    <Input
                      
                      value={editForm.employees}
                      onChange={(e) => setEditForm({...editForm, employees: parseInt(e.target.value)})}
                    />
                  ) : (
                    <p className="text-secondary-900 dark:text-secondary-100">{company.employees}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Statut
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      company.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {company.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleStatus}
                      className="text-xs"
                    >
                      {company.status === 'active' ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Adresse
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    />
                  ) : (
                    <p className="text-secondary-900 dark:text-secondary-100">{company.address}</p>
                  )}
                </div>

              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Informations personnelles de l'admin */}
      {adminUser && (
        <Card>
          <Card.Header>
            <Card.Title>Informations personnelles</Card.Title>
            <Card.Description>
              Informations de connexion de l'administrateur de l'entreprise
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Nom complet
                </label>
                <p className="text-secondary-900 dark:text-secondary-100">{adminUser.nomComplet || 'Non défini'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Email de connexion
                </label>
                <p className="text-secondary-900 dark:text-secondary-100">{adminUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Téléphone
                </label>
                <p className="text-secondary-900 dark:text-secondary-100">{adminUser.telephone || 'Non défini'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Mot de passe
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-secondary-900 dark:text-secondary-100 font-mono">
                      {showPlainPassword ? (adminUser?.motDePasseTemporaire || 'Non défini') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      className="text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors"
                      onClick={() => setShowPlainPassword(!showPlainPassword)}
                      title={showPlainPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPlainPassword ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {!showPasswordChange ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordChange(true)}
                    >
                      Modifier le mot de passe
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-48"
                      />
                      <Button
                        size="sm"
                        onClick={handleChangeAdminPassword}
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setAdminPassword('');
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Abonnement et facturation */}
      <Card>
        <Card.Header>
          <Card.Title>Abonnement et facturation</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Plan
              </label>
              <p className="text-secondary-900 dark:text-secondary-100 font-medium">{company.subscription.plan}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Statut de paiement
              </label>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                company.subscription.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {company.subscription.status === 'active' ? 'À jour' : 'En retard'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Prochain paiement
              </label>
              <p className="text-secondary-900 dark:text-secondary-100">{company.subscription.nextPayment}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Montant
              </label>
              <p className="text-secondary-900 dark:text-secondary-100 font-medium">{company.subscription.amount}</p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Aperçu de l'application personnalisée */}
      <Card>
        <Card.Header>
          <Card.Title>Aperçu de l'application personnalisée</Card.Title>
          <Card.Description>
            Voici comment l'interface apparaît pour cette entreprise avec son branding
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {/* Aperçu Dashboard */}
            <div 
              className="p-6 rounded-lg border-2"
              style={{ 
                backgroundColor: company.couleurPrincipale + '05',
                borderColor: company.couleurPrincipale + '20'
              }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: company.couleurPrincipale }}>
                  {company.logo ? (
                    <img src={company.logo} alt="Logo" className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-white text-xs font-bold">{company.name.charAt(0)}</span>
                  )}
                </div>
                <h4 className="font-semibold text-secondary-900 dark:text-secondary-100">
                  Dashboard {company.name}
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: company.couleurPrincipale + '15' }}
                >
                  <div className="text-lg font-bold text-white">
                    {company.employees}
                  </div>
                  <div className="text-xs text-white/80">Employés</div>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: company.couleurPrincipale + '15' }}
                >
                  <div className="text-lg font-bold text-white">
                    12
                  </div>
                  <div className="text-xs text-white/80">Bulletins</div>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: company.couleurPrincipale + '15' }}
                >
                  <div className="text-lg font-bold text-white">
                    8
                  </div>
                  <div className="text-xs text-white/80">Factures</div>
                </div>
              </div>
            </div>

            {/* Aperçu Bulletin de paie */}
            <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {company.logo && (
                    <img src={company.logo} alt="Logo" className="w-10 h-10 object-contain" />
                  )}
                  <div>
                    <h5 className="font-semibold text-secondary-900 dark:text-secondary-100">{company.name}</h5>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Bulletin de paie</p>
                  </div>
                </div>
                <div 
                  className="px-3 py-1 rounded text-white text-xs font-medium"
                  style={{ backgroundColor: company.couleurPrincipale }}
                >
                  Septembre 2024
                </div>
              </div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400">
                Aperçu du design des bulletins de paie avec le branding de l'entreprise
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Actions dangereuses */}
      <Card>
        <Card.Header>
          <Card.Title className="text-red-600 dark:text-red-400">Zone dangereuse</Card.Title>
          <Card.Description>
            Actions irréversibles qui affectent l'entreprise
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Supprimer définitivement
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default CompanyDetailsPage;