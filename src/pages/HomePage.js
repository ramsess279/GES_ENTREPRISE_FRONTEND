import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../utils/api';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [marketingContent, setMarketingContent] = useState({
    hero: [],
    benefits: [],
    stats: [],
    cta: []
  });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nomEntreprise: '',
    email: '',
    telephone: '',
    nomContact: '',
    emailUtilisateur: '',
    logo: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger le contenu marketing depuis l'API
  useEffect(() => {
    const fetchMarketingContent = async () => {
      try {
        const response = await api.get('/marketing');
        setMarketingContent(response.data.data);
      } catch (error) {
        console.error('Erreur lors du chargement du contenu marketing:', error);
        // Valeurs par défaut en cas d'erreur
        setMarketingContent({
          hero: [],
          benefits: [],
          stats: [],
          cta: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMarketingContent();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nomEntreprise', formData.nomEntreprise);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telephone', formData.telephone);
      formDataToSend.append('nomContact', formData.nomContact);
      formDataToSend.append('emailUtilisateur', formData.emailUtilisateur);
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }

      const response = await api.post('/entreprises/request', formDataToSend);

      alert(response.data.message || 'Votre demande de création d\'entreprise a été envoyée avec succès ! Le super-administrateur vous contactera bientôt.');
      setFormData({
        nomEntreprise: '',
        email: '',
        telephone: '',
        nomContact: '',
        emailUtilisateur: '',
        logo: null,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      alert('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header with Navigation Buttons and Login Link */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        <button
          onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-200 text-sm font-medium"
        >
          À propos
        </button>
        <button
          onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-200 text-sm font-medium"
        >
          Nous contacter
        </button>
        <Link to="/login" className="text-slate-300 hover:text-white transition-colors duration-200 text-sm font-medium">
          Se connecter
        </Link>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/3 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary-900/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-900/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="mb-16">
              {marketingContent.hero.length > 0 && (
                <>
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                    {marketingContent.hero[0]?.title || 'Révolutionnez la Gestion de vos Salaires'}
                  </h1>

                  <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                    {marketingContent.hero[0]?.description || 'Solution digitale premium pour entreprises modernes.'}
                  </p>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                <div className="glass-card p-8 rounded-2xl max-w-md w-full backdrop-blur-2xl bg-white/15 border border-white/30">
                  <h3 className="text-lg font-semibold text-white mb-4">Commencez votre transformation digitale</h3>
                  <p className="text-slate-300 text-sm mb-6">Rejoignez plus de 500 entreprises qui nous font confiance</p>
                  <Button
                    size="lg"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white border-0 shadow-xl text-base py-3"
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Créer mon compte entreprise
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center py-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/3 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary-900/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-900/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            {marketingContent.benefits.length > 0 && (
              <div>
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {marketingContent.benefits[0]?.title || 'Pourquoi nous choisir ?'}
                  </h2>
                  <p className="text-lg text-slate-300">
                    {marketingContent.benefits[0]?.subtitle || 'L\'excellence technologique au service de votre entreprise'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                  {marketingContent.benefits.slice(1).map((benefit, index) => (
                    <div key={index} className="glass-card p-6 rounded-2xl text-center backdrop-blur-2xl bg-white/15 border-white/30">
                      <h3 className="text-lg font-semibold text-white mb-3">{benefit.benefitTitle}</h3>
                      <p className="text-slate-300 text-sm">{benefit.benefitDesc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {marketingContent.stats.length > 0 && (
              <div>
                <div className="text-center mb-12">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                    {marketingContent.stats[0]?.title || 'Chiffres qui parlent'}
                  </h3>
                  <p className="text-lg text-slate-300">
                    {marketingContent.stats[0]?.subtitle || "La confiance de centaines d'entreprises"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {marketingContent.stats.slice(1).map((stat, index) => (
                    <div key={index} className="glass-card p-6 rounded-2xl text-center backdrop-blur-2xl bg-white/15 border-white/30">
                      <div className="text-3xl font-bold text-primary-400 mb-2">{stat.statValue}</div>
                      <div className="text-slate-300 text-sm">{stat.statLabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section with Form */}
      <section id="contact" className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center py-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/3 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary-900/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-900/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            {marketingContent.cta.length > 0 && (
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {marketingContent.cta[0]?.title || 'Prêt à digitaliser vos RH ?'}
                </h2>
                <p className="text-lg text-slate-300">
                  {marketingContent.cta[0]?.subtitle || 'Rejoignez l\'élite des entreprises modernes qui ont choisi l\'excellence opérationnelle'}
                </p>
              </div>
            )}

            <div className="max-w-6xl mx-auto">
              <div className="glass-card p-10 rounded-3xl shadow-2xl backdrop-blur-2xl bg-white/15 border-white/30">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">
                    Création de votre compte entreprise
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Démarrez votre transformation digitale en quelques minutes seulement
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-6 p-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Informations de l'entreprise</h4>
                      <Input
                        label="Nom de l'entreprise"
                        name="nomEntreprise"
                        value={formData.nomEntreprise}
                        onChange={handleInputChange}
                        placeholder="Ex: Mon Entreprise SARL"
                        className="dark:bg-white/20 bg-gray-100/20 backdrop-blur-md border-white/30 text-white dark:placeholder-slate-400 placeholder-gray-500 text-base"
                      />

                      <Input
                        label="Email de contact"
                        name="email"
                        
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contact@monentreprise.com"
                        className="dark:bg-white/20 bg-gray-100/20 backdrop-blur-md border-white/30 text-white dark:placeholder-slate-400 placeholder-gray-500 text-base"
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">Logo de l'entreprise</label>
                        <input
                          type="file"
                          name="logo"
                          accept="image/*"
                          onChange={handleInputChange}
                          className="w-full p-3 dark:bg-white/20 bg-gray-100/20 backdrop-blur-md border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:dark:bg-white/20 file:bg-gray-100/20 file:dark:text-white file:text-gray-900 hover:file:dark:bg-white/30 hover:file:bg-gray-200/30"
                        />
                      </div>

                    </div>

                    <div className="space-y-6 p-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Informations personnelles</h4>
                      <Input
                        label="Nom du contact"
                        name="nomContact"
                        value={formData.nomContact}
                        onChange={handleInputChange}
                        placeholder="Prénom NOM"
                        className="dark:bg-white/20 bg-gray-100/20 backdrop-blur-md border-white/30 text-white dark:placeholder-slate-400 placeholder-gray-500 text-lg"
                      />

                      <Input
                        label="Téléphone"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        placeholder="+221 XX XXX XX XX"
                        className="dark:bg-white/20 bg-gray-100/20 backdrop-blur-md border-white/30 text-white dark:placeholder-slate-400 placeholder-gray-500 text-lg"
                      />

                      <Input
                        label="Email de l'utilisateur"
                        name="emailUtilisateur"
                        
                        value={formData.emailUtilisateur}
                        onChange={handleInputChange}
                        placeholder="votre.email@exemple.com"
                        className="dark:bg-white/20 bg-gray-100/20 backdrop-blur-md border-white/30 text-white dark:placeholder-slate-400 placeholder-gray-500 text-base"
                      />
                    </div>
                  </div>

                  <div className="text-center pt-8">
                    <Button
                      type="submit"
                      size="lg"
                      loading={isSubmitting}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-3 text-base shadow-xl"
                    >
                      {isSubmitting ? 'Création en cours...' : 'Créer mon compte entreprise'}
                    </Button>
                    <p className="text-xs dark:text-slate-400 text-gray-500 mt-3">
                      Configuration en 5 minutes • Support technique inclus • Formation gratuite
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;