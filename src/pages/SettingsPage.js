import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Cog6ToothIcon, SwatchIcon, SunIcon, MoonIcon, UserIcon, BuildingOfficeIcon, UsersIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { companiesAPI, authAPI, usersAPI } from '../utils/api';

const SettingsPage = () => {
  const { user, isSuperAdmin, isAdmin, isSuperAdminInCompanyMode, companyColor, updateCompanyColor } = useAuth();
  const { theme, toggleTheme, updateColors, primaryColor, secondaryColor } = useTheme();
  const [settings, setSettings] = useState({
    primaryColor: '#FF6B35',
    secondaryColor: '#6b7280',
    themeMode: 'light'
  });
  const [companyInfo, setCompanyInfo] = useState(null);
  const [personalInfo, setPersonalInfo] = useState({
    nomComplet: user?.nomComplet || '',
    email: user?.email || '',
    telephone: user?.telephone || ''
  });
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userDetails, setUserDetails] = useState({
    email: '',
    motDePasseTemporaire: ''
  });
  const [passwordChange, setPasswordChange] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [adminActiveTab, setAdminActiveTab] = useState('personal');
  const [superAdminActiveTab, setSuperAdminActiveTab] = useState('general');

  // Charger les utilisateurs d'une entreprise spécifique
  const loadUsers = useCallback(async () => {
    if ((isAdmin || isSuperAdminInCompanyMode) && user?.entrepriseId) {
      try {
        setUsersLoading(true);
        const response = await usersAPI.getAll({
          includeEmployeeUsers: true,
          entrepriseId: user.entrepriseId
        });
        setUsers(response.data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    }
  }, [isAdmin, isSuperAdminInCompanyMode, user?.entrepriseId]);

  // Charger tous les utilisateurs du système (pour super-admin)
  const loadAllUsers = useCallback(async () => {
    if (isSuperAdmin) {
      try {
        setUsersLoading(true);
        const response = await usersAPI.getAll({
          includeEmployeeUsers: true
        });
        setAllUsers(response.data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement de tous les utilisateurs:', error);
        setAllUsers([]);
      } finally {
        setUsersLoading(false);
      }
    }
  }, [isSuperAdmin]);

  // Charger les paramètres actuels et les infos de l'entreprise
  useEffect(() => {
    const loadData = async () => {
      if (isSuperAdminInCompanyMode) {
        setSettings({
          primaryColor: companyColor || '#FF6B35',
          secondaryColor: '#6b7280',
          themeMode: theme === 'dark' ? 'dark' : 'light'
        });
      } else {
        setSettings({
          primaryColor,
          secondaryColor,
          themeMode: theme === 'dark' ? 'dark' : 'light'
        });
      }

      // Charger les infos de l'entreprise pour les admins et super-admins en mode entreprise
      if ((isAdmin || isSuperAdminInCompanyMode) && user?.entrepriseId) {
        try {
          const response = await companiesAPI.getById(user.entrepriseId);
          setCompanyInfo(response.data);
        } catch (error) {
          console.error('Erreur lors du chargement des infos entreprise:', error);
        }
      }

      // Charger les utilisateurs
      if (isSuperAdmin) {
        // Super-admin : charger tous les utilisateurs
        await loadAllUsers();
      } else if (isAdmin && user?.entrepriseId) {
        // Admin : charger les utilisateurs de l'entreprise
        await loadUsers();
      }
    };

    loadData();
  }, [theme, primaryColor, companyColor, isAdmin, user?.entrepriseId, isSuperAdminInCompanyMode, isSuperAdmin, loadAllUsers, loadUsers, secondaryColor]);

  const handleColorChange = (colorType, value) => {
    setSettings(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setSettings(prev => ({
      ...prev,
      themeMode: newTheme
    }));
    toggleTheme();
  };

  const handleSave = async () => {
     setLoading(true);
     try {
       if (isSuperAdminInCompanyMode) {
         // Sauvegarder la couleur de l'entreprise
         const result = await companiesAPI.update(user.entrepriseId, { couleurPrimaire: settings.primaryColor });
         if (result.data.success) {
           updateCompanyColor(settings.primaryColor);
         } else {
           throw new Error('Erreur lors de la sauvegarde');
         }
       } else if (isAdmin) {
         // Pour les admins, sauvegarder les infos personnelles
         const result = await authAPI.updateProfile(personalInfo);
         if (result.data.success) {
         } else {
           throw new Error('Erreur lors de la sauvegarde');
         }
       } else {
         // Pour les super-admins, appliquer la couleur globale
         updateColors(settings.primaryColor, settings.secondaryColor);
       }
     } catch (error) {
       console.error('Erreur lors de la sauvegarde:', error);
     } finally {
       setLoading(false);
     }
   };

  const handleReset = () => {
    setSettings({
      primaryColor: '#FF6B35',
      secondaryColor: '#6b7280',
      themeMode: 'light'
    });
    updateColors('#FF6B35', '#6b7280'); // Remettre la couleur par défaut
    if (theme === 'dark') {
      toggleTheme();
    }
  };

  const handleShowUserDetails = (user) => {
    setSelectedUser(user);
    setUserDetails({
      email: user.email,
      motDePasseTemporaire: user.motDePasseTemporaire || ''
    });
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setUserDetails({ email: '', motDePasseTemporaire: '' });
  };

  const handleSaveUserDetails = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await usersAPI.update(selectedUser.id, {
        email: userDetails.email,
        ...(userDetails.motDePasseTemporaire && {
          motDePasseTemporaire: userDetails.motDePasseTemporaire
        })
      });

      // Recharger la liste des utilisateurs
      if (isSuperAdmin) {
        await loadAllUsers();
      }

      handleCloseUserModal();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    try {
      setLoading(true);
      // Ici vous pouvez ajouter la logique pour sauvegarder les infos personnelles
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      return;
    }

    if (passwordChange.newPassword.length < 6) {
      return;
    }

    try {
      setLoading(true);
      // Ici vous pouvez ajouter l'appel API pour changer le mot de passe
      // await authAPI.changePassword({ newPassword: passwordChange.newPassword });
      setPasswordChange({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
    } finally {
      setLoading(false);
    }
  };


  // Pour les super-admins, afficher avec onglets
  if (isSuperAdmin) {
    return (
      <div className="space-y-6 min-h-screen dark:bg-slate-900 bg-gray-50 p-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Paramètres de l'application
          </h1>
          <p className="text-secondary-600 dark:text-slate-300 mt-1">
            Gérez les paramètres globaux et les utilisateurs du système
          </p>
        </div>

        {/* Onglets pour super-admins */}
        <div className="border-b border-secondary-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSuperAdminActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                superAdminActiveTab === 'general'
                  ? 'border-primary-dynamic text-primary-dynamic'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Général
            </button>
            <button
              onClick={() => setSuperAdminActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                superAdminActiveTab === 'users'
                  ? 'border-primary-dynamic text-primary-dynamic'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Utilisateurs
            </button>
            <button
              onClick={() => setSuperAdminActiveTab('preferences')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                superAdminActiveTab === 'preferences'
                  ? 'border-primary-dynamic text-primary-dynamic'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Préférences
            </button>
          </nav>
        </div>

        {/* Contenu des onglets pour super-admins */}
        {superAdminActiveTab === 'general' && (
          <>
            {/* Thème */}
            <Card>
              <Card.Header>
                <div className="flex items-center space-x-3">
                  {theme === 'dark' ? (
                    <MoonIcon className="w-6 h-6 text-primary-dynamic" />
                  ) : (
                    <SunIcon className="w-6 h-6 text-primary-dynamic" />
                  )}
                  <div>
                    <Card.Title>Thème de l'application</Card.Title>
                    <Card.Description>
                      Choisissez entre le mode clair et sombre
                    </Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-yellow-400'}`}></div>
                    <span className="font-medium">
                      {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
                    </span>
                  </div>
                  <Button
                    onClick={handleThemeToggle}
                    variant="outline"
                    size="sm"
                  >
                    Basculer vers {theme === 'dark' ? 'clair' : 'sombre'}
                  </Button>
                </div>
              </Card.Content>
            </Card>

            {/* Couleurs */}
            <Card>
              <Card.Header>
                <div className="flex items-center space-x-3">
                  <SwatchIcon className="w-6 h-6 text-primary-dynamic" />
                  <div>
                    <Card.Title>Couleur principale de l'application</Card.Title>
                    <Card.Description>
                      Personnalisez la couleur principale utilisée dans l'interface
                    </Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-6">
                  {/* Couleur primaire */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300">
                      Couleur primaire
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-secondary-300 dark:border-slate-600 cursor-pointer"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        placeholder="#FF6B35"
                        className="flex-1"
                      />
                    </div>
                    <div
                      className="w-full h-8 rounded"
                      style={{ backgroundColor: settings.primaryColor }}
                    ></div>
                  </div>

                  {/* Couleur secondaire */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300">
                      Couleur secondaire
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-secondary-300 dark:border-slate-600 cursor-pointer"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        placeholder="#6b7280"
                        className="flex-1"
                      />
                    </div>
                    <div
                      className="w-full h-8 rounded"
                      style={{ backgroundColor: settings.secondaryColor }}
                    ></div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={loading}
              >
                Réinitialiser
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </>
        )}

        {superAdminActiveTab === 'users' && (
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <UsersIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Gestion des utilisateurs système</Card.Title>
                  <Card.Description>
                    Consultez tous les utilisateurs créés automatiquement dans le système
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              {usersLoading ? (
                <div className="text-center py-8">
                  <p className="text-secondary-600 dark:text-slate-400">Chargement des utilisateurs...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                    Aucun utilisateur système
                  </h3>
                  <p className="text-secondary-600 dark:text-slate-400">
                    Les utilisateurs système seront créés automatiquement lors de l'ajout d'employés caissiers ou vigiles
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-secondary-200 dark:border-slate-600 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-secondary-900 dark:text-white">
                            {user.nomComplet}
                          </div>
                          <div className="text-sm text-secondary-500 dark:text-slate-300">
                            {user.email} • {user.role}
                          </div>
                          {user.employe && (
                            <div className="text-xs text-secondary-400 dark:text-slate-500">
                              Entreprise: {user.employe.entreprise?.nom || 'N/A'}
                            </div>
                          )}
                          {user.motDePasseTemporaire && user.employe?.email && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                              🔐 Connexion: {user.employe.email} / {user.motDePasseTemporaire}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.statut === 'actif'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.statut}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        )}

        {superAdminActiveTab === 'preferences' && (
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <Cog6ToothIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Préférences utilisateur</Card.Title>
                  <Card.Description>
                    Personnalisez votre expérience et gérez vos identifiants
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                {/* Thème */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-3">
                    Thème de l'application
                  </label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-yellow-400'}`}></div>
                      <span className="font-medium">
                        {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
                      </span>
                    </div>
                    <Button
                      onClick={handleThemeToggle}
                      variant="outline"
                      size="sm"
                    >
                      Basculer vers {theme === 'dark' ? 'clair' : 'sombre'}
                    </Button>
                  </div>
                </div>

                {/* Couleur personnalisée */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-3">
                    Couleur d'accentuation
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="w-12 h-10 rounded border border-secondary-300 dark:border-slate-600 cursor-pointer"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      placeholder="#FF6B35"
                      className="flex-1"
                    />
                  </div>
                  <div
                    className="w-full h-8 rounded mt-2"
                    style={{ backgroundColor: settings.primaryColor }}
                  ></div>
                </div>

                {/* Identifiants de connexion */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-3">
                    Identifiants de connexion
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-secondary-600 dark:text-slate-400 mb-1">
                        Email actuel
                      </label>
                      <Input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                        placeholder="votre.email@exemple.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary-600 dark:text-slate-400 mb-1">
                        Nouveau mot de passe
                      </label>
                      <Input
                        type="password"
                        value={passwordChange.newPassword}
                        onChange={(e) => setPasswordChange({...passwordChange, newPassword: e.target.value})}
                        placeholder="Laissez vide pour ne pas changer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary-600 dark:text-slate-400 mb-1">
                        Confirmer le nouveau mot de passe
                      </label>
                      <Input
                        type="password"
                        value={passwordChange.confirmPassword}
                        onChange={(e) => setPasswordChange({...passwordChange, confirmPassword: e.target.value})}
                        placeholder="Confirmer le mot de passe"
                      />
                    </div>
                    {passwordChange.newPassword && (
                      <div className="flex justify-end">
                        <Button
                          onClick={handleChangePassword}
                          disabled={loading}
                          size="sm"
                        >
                          {loading ? 'Changement...' : 'Changer le mot de passe'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Modal pour les détails utilisateur - DANS la section super-admin */}
        {showUserModal && (
          <UserDetailsModal
            user={selectedUser}
            show={showUserModal}
            onClose={handleCloseUserModal}
            onSave={handleSaveUserDetails}
            details={userDetails}
            setDetails={setUserDetails}
            loading={loading}
          />
        )}

      </div>
    );
  }

  // Pour les admins d'entreprise - interface avec onglets
  if (isAdmin || (isSuperAdmin && isSuperAdminInCompanyMode)) {
    return (
      <div className="space-y-6 min-h-screen dark:bg-slate-900 bg-gray-50 p-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Paramètres
          </h1>
          <p className="text-secondary-600 dark:text-slate-300 mt-1">
            Gérez vos informations personnelles et l'apparence de l'application
          </p>
        </div>

        {/* Onglets pour admins */}
        <div className="border-b border-secondary-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setAdminActiveTab('personal')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                adminActiveTab === 'personal'
                  ? 'border-primary-dynamic text-primary-dynamic'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Personnel
            </button>
            <button
              onClick={() => setAdminActiveTab('company')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                adminActiveTab === 'company'
                  ? 'border-primary-dynamic text-primary-dynamic'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Entreprise
            </button>
            <button
              onClick={() => setAdminActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                adminActiveTab === 'users'
                  ? 'border-primary-dynamic text-primary-dynamic'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Utilisateurs
            </button>
            <button
              onClick={() => setAdminActiveTab('appearance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                adminActiveTab === 'appearance'
                  ? 'border-primary-dynamic text-primary-dynamic'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Apparence
            </button>
          </nav>
        </div>

        {/* Contenu des onglets pour admins */}
        {adminActiveTab === 'personal' && (
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <UserIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Informations personnelles</Card.Title>
                  <Card.Description>
                    Gérez vos informations de profil
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                      Nom complet
                    </label>
                    <Input
                      value={personalInfo.nomComplet}
                      onChange={(e) => setPersonalInfo({...personalInfo, nomComplet: e.target.value})}
                      placeholder="Votre nom complet"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <Input

                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                      placeholder="votre.email@exemple.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                      Téléphone
                    </label>
                    <Input
                      value={personalInfo.telephone}
                      onChange={(e) => setPersonalInfo({...personalInfo, telephone: e.target.value})}
                      placeholder="+221 XX XXX XX XX"
                    />
                  </div>
                </div>

                {/* Changement de mot de passe */}
                <div className="border-t border-secondary-200 dark:border-slate-600 pt-6">
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">
                    Changer le mot de passe
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                        Nouveau mot de passe
                      </label>
                      <Input
                        type="password"
                        value={passwordChange.newPassword}
                        onChange={(e) => setPasswordChange({...passwordChange, newPassword: e.target.value})}
                        placeholder="Entrez votre nouveau mot de passe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                        Confirmer le nouveau mot de passe
                      </label>
                      <Input
                        type="password"
                        value={passwordChange.confirmPassword}
                        onChange={(e) => setPasswordChange({...passwordChange, confirmPassword: e.target.value})}
                        placeholder="Confirmez votre nouveau mot de passe"
                      />
                    </div>
                    {passwordChange.newPassword && (
                      <div className="flex justify-start">
                        <Button
                          onClick={handleChangePassword}
                          disabled={loading}
                          size="sm"
                        >
                          {loading ? 'Changement...' : 'Changer le mot de passe'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end border-t border-secondary-200 dark:border-slate-600 pt-6">
                  <Button onClick={handleSavePersonalInfo} disabled={loading}>
                    {loading ? 'Sauvegarde...' : 'Sauvegarder les informations'}
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        {adminActiveTab === 'company' && (
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <BuildingOfficeIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Informations de l'entreprise</Card.Title>
                  <Card.Description>
                    Consultez les informations de votre entreprise
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              {companyInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                      Nom de l'entreprise
                    </label>
                    <p className="text-secondary-900 dark:text-white font-medium">{companyInfo.nom}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <p className="text-secondary-900 dark:text-white">{companyInfo.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                      Téléphone
                    </label>
                    <p className="text-secondary-900 dark:text-white">{companyInfo.telephone || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                      Adresse
                    </label>
                    <p className="text-secondary-900 dark:text-white">{companyInfo.adresse || 'Non spécifiée'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                      Couleur primaire
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-secondary-300 dark:border-slate-600"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        placeholder="#FF6B35"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-secondary-600 dark:text-slate-400">Chargement des informations...</p>
                </div>
              )}
              {companyInfo && (
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>
        )}

        {adminActiveTab === 'users' && (
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <UsersIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Gestion des utilisateurs</Card.Title>
                  <Card.Description>
                    Consultez et gérez les utilisateurs système (caissiers, vigiles)
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              {usersLoading ? (
                <div className="text-center py-8">
                  <p className="text-secondary-600 dark:text-slate-400">Chargement des utilisateurs...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                    Aucun utilisateur système
                  </h3>
                  <p className="text-secondary-600 dark:text-slate-400">
                    Les utilisateurs système seront créés automatiquement lors de l'ajout d'employés caissiers ou vigiles
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-secondary-200 dark:border-slate-600 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-secondary-900 dark:text-white">
                            {user.nomComplet}
                          </div>
                          <div className="text-sm text-secondary-500 dark:text-slate-300">
                            {user.email} • {user.role}
                          </div>
                          {user.employe && (
                            <div className="text-xs text-secondary-400 dark:text-slate-500">
                              Lié à l'employé: {user.employe.nomComplet}
                            </div>
                          )}
                          {user.motDePasseTemporaire && user.employe?.email && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                              🔐 Connexion: {user.employe.email} / {user.motDePasseTemporaire}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleShowUserDetails(user)}
                          variant="outline"
                          size="sm"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Détails
                        </Button>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.statut === 'actif'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.statut}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        )}

        {adminActiveTab === 'appearance' && (
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <SwatchIcon className="w-6 h-6 text-primary-dynamic" />
                <div>
                  <Card.Title>Apparence</Card.Title>
                  <Card.Description>
                    Personnalisez l'apparence de l'application
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                {/* Thème */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-3">
                    Thème de l'application
                  </label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-yellow-400'}`}></div>
                      <span className="font-medium">
                        {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
                      </span>
                    </div>
                    <Button
                      onClick={handleThemeToggle}
                      variant="outline"
                      size="sm"
                    >
                      Basculer vers {theme === 'dark' ? 'clair' : 'sombre'}
                    </Button>
                  </div>
                </div>

                {/* Couleur de l'entreprise */}
                {companyInfo && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-3">
                      Couleur de l'entreprise
                    </label>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded border border-secondary-300 dark:border-slate-600"
                        style={{ backgroundColor: companyInfo.couleurPrimaire }}
                      ></div>
                      <span className="text-secondary-900 dark:text-white font-medium">
                        {companyInfo.couleurPrimaire}
                      </span>
                      <span className="text-sm text-secondary-600 dark:text-slate-400">
                        {isSuperAdmin ? '(Modifiable depuis les paramètres)' : '(Définie par l\'entreprise)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Modal pour les détails utilisateur */}
        {showUserModal && (
          <UserDetailsModal
            user={selectedUser}
            show={showUserModal}
            onClose={handleCloseUserModal}
            onSave={handleSaveUserDetails}
            details={userDetails}
            setDetails={setUserDetails}
            loading={loading}
          />
        )}
      </div>
    );
  }
};

// Modal pour les détails utilisateur
const UserDetailsModal = ({ user, show, onClose, onSave, details, setDetails, loading }) => {
  if (!show || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Détails de l'utilisateur
          </h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
              Nom complet
            </label>
            <p className="text-secondary-900 dark:text-white font-medium">{user.nomComplet}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
              Email de connexion
            </label>
            <Input
              value={details.email}
              onChange={(e) => setDetails({...details, email: e.target.value})}
              placeholder="email@exemple.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
              Mot de passe temporaire
            </label>
            <Input
              type="password"
              value={details.motDePasseTemporaire}
              onChange={(e) => setDetails({...details, motDePasseTemporaire: e.target.value})}
              placeholder="Nouveau mot de passe"
            />
            <p className="text-xs text-secondary-500 dark:text-slate-400 mt-1">
              Laissez vide pour garder le mot de passe actuel
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
              Rôle
            </label>
            <p className="text-secondary-900 dark:text-white">{user.role}</p>
          </div>

          {user.employe && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                Entreprise
              </label>
              <p className="text-secondary-900 dark:text-white">
                {user.employe.entreprise?.nom || 'N/A'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
              Statut
            </label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              user.statut === 'actif'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {user.statut}
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-secondary-200 dark:border-slate-700">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={onSave}
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;