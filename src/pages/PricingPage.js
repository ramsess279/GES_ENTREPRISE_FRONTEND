import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CheckIcon, XMarkIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const PricingPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    currency: 'XOF',
    period: 'mois',
    features: [],
    maxEmployees: '',
    description: ''
  });

  // Plans de tarification depuis l'API
  const [pricingPlans, setPricingPlans] = useState([]);

  // Charger les plans depuis l'API
  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pricing');
      // Transformer les données pour correspondre au format attendu par le frontend
      const transformedPlans = response.data.data.map(plan => ({
        ...plan,
        features: plan.features.map(f => f.feature), // Extraire les noms des fonctionnalités
        currency: 'FCFA' // Pour l'affichage
      }));
      setPricingPlans(transformedPlans);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des plans:', err);
      setError('Erreur lors du chargement des plans de tarification');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan({ ...plan });
    setIsEditing(true);
  };

  const handleSavePlan = async () => {
    try {
      // Transformer les données pour l'API
      const planData = {
        ...editingPlan,
        maxEmployees: parseInt(editingPlan.maxEmployees),
        price: parseFloat(editingPlan.price)
      };

      await api.patch(`/pricing/${editingPlan.id}`, planData);
      await loadPricingPlans(); // Recharger les données
      setIsEditing(false);
      setEditingPlan(null);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde du plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      try {
        await api.delete(`/pricing/${planId}`);
        await loadPricingPlans(); // Recharger les données
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression du plan');
      }
    }
  };

  const handleToggleActive = async (planId) => {
    try {
      await api.patch(`/pricing/${planId}/toggle`);
      await loadPricingPlans(); // Recharger les données
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      alert('Erreur lors du changement de statut du plan');
    }
  };

  const handleAddFeature = (planId, feature) => {
    if (isEditing && editingPlan.id === planId) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, feature]
      });
    }
  };

  const handleRemoveFeature = (planId, featureIndex) => {
    if (isEditing && editingPlan.id === planId) {
      setEditingPlan({
        ...editingPlan,
        features: editingPlan.features.filter((_, index) => index !== featureIndex)
      });
    }
  };

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: currency === 'FCFA' ? 'XOF' : 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Chargement des plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">{error}</p>
          <Button onClick={loadPricingPlans}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Gestion de la Tarification
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Gérez les plans d'abonnement et la tarification
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nouveau plan
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content className="p-6 text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {pricingPlans.filter(plan => plan.active).length}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">Plans actifs</div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {pricingPlans.reduce((total, plan) => {
                // Simulation du nombre d'abonnés par plan
                const subscribers = plan.name === 'Starter' ? 45 : plan.name === 'Business' ? 67 : 15;
                return total + (plan.active ? subscribers : 0);
              }, 0)}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">Abonnements actifs</div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="p-6 text-center">
            <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
              {formatPrice(
                pricingPlans.reduce((total, plan) => {
                  const subscribers = plan.name === 'Starter' ? 45 : plan.name === 'Business' ? 67 : 15;
                  return total + (plan.active ? plan.price * subscribers : 0);
                }, 0),
                'FCFA'
              )}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">Revenus mensuels</div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="p-6 text-center">
            <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
              {pricingPlans.find(plan => plan.popular)?.name || 'Aucun'}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">Plan le plus populaire</div>
          </Card.Content>
        </Card>
      </div>

      {/* Plans de tarification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Plus populaire
                </span>
              </div>
            )}
            
            <Card.Content className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                  {isEditing && editingPlan?.id === plan.id ? (
                    <Input
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                      className="text-center"
                    />
                  ) : (
                    plan.name
                  )}
                </h3>
                
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                  {isEditing && editingPlan?.id === plan.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Input
                        
                        value={editingPlan.price}
                        onChange={(e) => setEditingPlan({...editingPlan, price: parseInt(e.target.value)})}
                        className="w-24 text-center"
                      />
                      <span className="text-sm">FCFA</span>
                    </div>
                  ) : (
                    formatPrice(plan.price, plan.currency)
                  )}
                </div>
                
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  par {plan.period}
                </div>
                
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                  {isEditing && editingPlan?.id === plan.id ? (
                    <Input
                      value={editingPlan.description}
                      onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                    />
                  ) : (
                    plan.description
                  )}
                </p>
              </div>

              {/* Fonctionnalités */}
              <div className="space-y-3 mb-6">
                {(isEditing && editingPlan?.id === plan.id ? editingPlan.features : plan.features).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {isEditing && editingPlan?.id === plan.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...editingPlan.features];
                            newFeatures[index] = e.target.value;
                            setEditingPlan({...editingPlan, features: newFeatures});
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFeature(plan.id, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">{feature}</span>
                    )}
                  </div>
                ))}
                
                {isEditing && editingPlan?.id === plan.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddFeature(plan.id, 'Nouvelle fonctionnalité')}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Ajouter une fonctionnalité
                  </Button>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {isEditing && editingPlan?.id === plan.id ? (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingPlan(null);
                      }}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleSavePlan} className="flex-1">
                      Sauvegarder
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEditPlan(plan)}
                      className="w-full"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleToggleActive(plan.id)}
                        className={`flex-1 ${
                          plan.active 
                            ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400' 
                            : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400'
                        }`}
                      >
                        {plan.active ? 'Désactiver' : 'Activer'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Statut */}
              <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">Statut:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    plan.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {plan.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Statistiques détaillées */}
      <Card>
        <Card.Header>
          <Card.Title>Statistiques des abonnements</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Abonnés</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Revenus mensuels</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Taux de conversion</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pricingPlans.map(plan => (
                  <tr key={plan.id} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className="py-3 px-4">
                      <div className="font-medium text-secondary-900 dark:text-secondary-100">{plan.name}</div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">{formatPrice(plan.price, plan.currency)}/{plan.period}</div>
                    </td>
                    <td className="py-3 px-4 text-secondary-900 dark:text-secondary-100">
                      {(() => {
                        const subscribers = plan.name === 'Starter' ? 45 : plan.name === 'Business' ? 67 : 15;
                        return plan.active ? subscribers : 0;
                      })()}
                    </td>
                    <td className="py-3 px-4 text-secondary-900 dark:text-secondary-100">
                      {(() => {
                        const subscribers = plan.name === 'Starter' ? 45 : plan.name === 'Business' ? 67 : 15;
                        const revenue = plan.active ? plan.price * subscribers : 0;
                        return formatPrice(revenue, plan.currency);
                      })()}
                    </td>
                    <td className="py-3 px-4 text-secondary-900 dark:text-secondary-100">
                      {(() => {
                        const conversion = plan.name === 'Starter' ? '12%' : plan.name === 'Business' ? '8%' : '5%';
                        return plan.active ? conversion : '0%';
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        plan.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {plan.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      {/* Modal d'ajout de nouveau plan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Nouveau plan de tarification
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom du plan"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  placeholder="Ex: Premium"
                />
                
                <Input
                  label="Prix (FCFA)"
                  
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                  placeholder="Ex: 35000"
                />
                
                <Input
                  label="Nombre max d'employés"
                  
                  value={newPlan.maxEmployees}
                  onChange={(e) => setNewPlan({...newPlan, maxEmployees: e.target.value})}
                  placeholder="Ex: 25"
                />
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Période
                  </label>
                  <select
                    value={newPlan.period}
                    onChange={(e) => setNewPlan({...newPlan, period: e.target.value})}
                    className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                  >
                    <option value="mois">Mois</option>
                    <option value="année">Année</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                  placeholder="Description du plan..."
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const planData = {
                        ...newPlan,
                        price: parseFloat(newPlan.price),
                        maxEmployees: parseInt(newPlan.maxEmployees),
                        features: ['Fonctionnalités de base'], // Fonctionnalités par défaut
                        popular: false,
                        active: true
                      };

                      await api.post('/pricing', planData);
                      await loadPricingPlans(); // Recharger les données

                      setShowAddModal(false);
                      setNewPlan({
                        name: '',
                        price: '',
                        currency: 'XOF',
                        period: 'mois',
                        features: [],
                        maxEmployees: '',
                        description: ''
                      });
                    } catch (err) {
                      console.error('Erreur lors de la création:', err);
                      alert('Erreur lors de la création du plan');
                    }
                  }}
                  className="flex-1"
                >
                  Créer le plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;