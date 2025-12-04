import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { EyeIcon, EyeSlashIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Validation email
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    // Validation mot de passe
    if (!formData.motDePasse.trim()) {
      errors.motDePasse = 'Le mot de passe est requis';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
    // Clear field error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors({
        ...fieldErrors,
        [e.target.name]: '',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(formData.email, formData.motDePasse);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen dark:bg-slate-900 bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">
            Connexion
          </h1>
          <p className="dark:text-slate-300 text-gray-600">
            Accédez à votre compte
          </p>
        </div>

        <div className="glass-card p-12 rounded-2xl backdrop-blur-3xl dark:bg-white/8 bg-gray-100/8 border dark:border-white/10 border-gray-300/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              name="email"

              value={formData.email}
              onChange={handleInputChange}
              placeholder="votre.email@exemple.com"
              error={fieldErrors.email}
              className="dark:bg-white/20 bg-gray-100/20 backdrop-blur-md dark:border-white/30 border-gray-300/30 dark:text-white text-gray-900 dark:placeholder-slate-400 placeholder-gray-500"
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                name="motDePasse"
                type={showPassword ? 'text' : 'password'}
                value={formData.motDePasse}
                onChange={handleInputChange}
                placeholder="Votre mot de passe"
                error={fieldErrors.motDePasse}
                className="dark:bg-white/20 bg-gray-100/20 backdrop-blur-md dark:border-white/30 border-gray-300/30 dark:text-white text-gray-900 dark:placeholder-slate-400 placeholder-gray-500"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-9 dark:text-slate-400 text-gray-500 hover:dark:text-slate-200 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white border-0 shadow-xl"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="dark:text-slate-400 text-gray-500 hover:dark:text-slate-200 hover:text-gray-700 transition-colors duration-200"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;