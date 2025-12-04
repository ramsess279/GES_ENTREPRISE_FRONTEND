import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Cog6ToothIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const UserSettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme, updateColors, primaryColor, secondaryColor } = useTheme();
  const [settings, setSettings] = useState({
    primaryColor: '#FF6B35',
    secondaryColor: '#6b7280'
  });
  const [personalInfo, setPersonalInfo] = useState({
    nomComplet: '',
    email: '',
    telephone: ''
  });
  const [passwordChange, setPasswordChange] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize settings with current theme values
    setSettings({
      primaryColor,
      secondaryColor
    });
    setPersonalInfo({
      nomComplet: user?.nomComplet || '',
      email: user?.email || '',
      telephone: user?.telephone || ''
    });
  }, [primaryColor, secondaryColor, user]);

  const handleColorChange = (colorType, value) => {
    const newSettings = {
      ...settings,
      [colorType]: value
    };
    setSettings(newSettings);
    // Apply colors immediately
    updateColors(newSettings.primaryColor, newSettings.secondaryColor);
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      updateColors(settings.primaryColor, settings.secondaryColor);
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
      setPasswordChange({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 min-h-screen dark:bg-slate-900 bg-gray-50 p-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Préférences utilisateur
        </h1>
        <p className="text-secondary-600 dark:text-slate-300 mt-1">
          Gérez vos paramètres personnels et l'apparence de l'application
        </p>
      </div>

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

      {/* Couleur personnalisée */}
      <Card>
        <Card.Header>
          <div className="flex items-center space-x-3">
            <Cog6ToothIcon className="w-6 h-6 text-primary-dynamic" />
            <div>
              <Card.Title>Couleur d'accentuation</Card.Title>
              <Card.Description>
                Personnalisez les couleurs primaire et secondaire utilisées dans l'interface
              </Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="space-y-6">
            <div>
              <label className="block text-xs text-secondary-600 dark:text-secondary-400 mb-2">
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
                className="w-full h-6 rounded mt-2"
                style={{ backgroundColor: settings.primaryColor }}
              ></div>
            </div>

            <div>
              <label className="block text-xs text-secondary-600 dark:text-secondary-400 mb-2">
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
                className="w-full h-6 rounded mt-2"
                style={{ backgroundColor: settings.secondaryColor }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                Les couleurs sont appliquées automatiquement
              </p>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? 'Sauvegarde...' : 'Sauvegarder définitivement'}
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <Card.Header>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.nomComplet?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <Card.Title>Informations personnelles</Card.Title>
              <Card.Description>
                Mettez à jour vos informations de profil
              </Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
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
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                placeholder="votre.email@exemple.com"
              />
            </div>
            <div>
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
        </Card.Content>
      </Card>

      {/* Changement de mot de passe */}
      <Card>
        <Card.Header>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">🔒</span>
            </div>
            <div>
              <Card.Title>Changer le mot de passe</Card.Title>
              <Card.Description>
                Modifiez votre mot de passe de connexion
              </Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                Nouveau mot de passe
              </label>
              <Input
                type="password"
                value={passwordChange.newPassword}
                onChange={(e) => setPasswordChange({...passwordChange, newPassword: e.target.value})}
                placeholder="Nouveau mot de passe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-slate-300 mb-2">
                Confirmer le mot de passe
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
                >
                  {loading ? 'Changement...' : 'Changer le mot de passe'}
                </Button>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default UserSettingsPage;