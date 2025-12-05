import axios from 'axios';
import mockData from '../mockData.json';

// Configuration de base d'Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3010/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Mock API functions
const mockAPI = {
  get: (endpoint) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let data = null;

        // Marketing endpoints
        if (endpoint === '/marketing') {
          data = mockData.marketing;
        } else if (endpoint.startsWith('/marketing/')) {
          const section = endpoint.replace('/marketing/', '');
          data = mockData.marketing[section] || [];
        }

        // Companies endpoints
        else if (endpoint === '/entreprises') {
          data = mockData.companies;
        } else if (endpoint.startsWith('/entreprises/')) {
          const id = endpoint.split('/')[2];
          data = mockData.companies.find(c => c.id === id);
        }

        // Employees endpoints
        else if (endpoint === '/employes') {
          data = mockData.employees;
        } else if (endpoint.startsWith('/employes/company/')) {
          const companyId = endpoint.split('/')[3];
          data = mockData.employees.filter(e => e.entrepriseId === companyId);
        }

        // Payruns endpoints
        else if (endpoint === '/payruns') {
          data = mockData.payruns;
        }

        // Payslips endpoints
        else if (endpoint === '/payslips') {
          data = mockData.payslips;
        } else if (endpoint.startsWith('/payslips/employee/')) {
          const employeeId = endpoint.split('/')[3];
          data = mockData.payslips.filter(p => p.employeId === employeeId);
        } else if (endpoint.startsWith('/payslips/payrun/')) {
          const payrunId = endpoint.split('/')[3];
          data = mockData.payslips.filter(p => p.payRunId === payrunId);
        }

        // Payments endpoints
        else if (endpoint === '/paies') {
          data = mockData.payments;
        }

        // Users endpoints
        else if (endpoint === '/utilisateurs') {
          data = mockData.users;
        } else if (endpoint.startsWith('/utilisateurs/admin/')) {
          const companyId = endpoint.split('/')[3];
          data = mockData.users.filter(u => u.entrepriseId === companyId && u.role === 'admin');
        }

        // Dashboard endpoints
        else if (endpoint === '/dashboard') {
          data = mockData.dashboard.stats;
        } else if (endpoint === '/dashboard/stats') {
          data = mockData.dashboard.stats;
        } else if (endpoint === '/dashboard/frequency-evolution') {
          data = mockData.dashboard.frequencyEvolution;
        } else if (endpoint === '/dashboard/upcoming-payments') {
          data = mockData.dashboard.upcomingPayments;
        }

        // Pricing endpoints
        else if (endpoint === '/pricing') {
          data = [{ id: '1', name: 'Starter', price: 50000, maxEmployees: 50 }];
        }

        resolve({
          data: {
            success: true,
            data: data
          }
        });
      }, 500); // Simulate network delay
    });
  },

  post: (endpoint, payload) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Auth endpoints
        if (endpoint === '/auth/login') {
          const { email, motDePasse } = payload;
          let user = null;

          // Test accounts
          const testAccounts = {
            'rama.gueye@odc.sn': 'passer123',
            'fatou.ndiaye@sonatel.sn': 'admin123',
            'moussa.fall@sonatel.sn': 'caissier123',
            'aminata.sow@sonatel.sn': 'employe123',
            'ibrahima.diallo@sonatel.sn': 'vigile123'
          };

          if (testAccounts[email] && testAccounts[email] === motDePasse) {
            user = mockData.users.find(u => u.email === email);
            // If user not found in mock data, create a mock user
            if (!user) {
              user = {
                id: 'mock-user-' + Date.now(),
                nomComplet: email.split('@')[0].replace('.', ' ').toUpperCase(),
                email: email,
                role: email.includes('caissier') ? 'caissier' :
                      email.includes('vigile') ? 'vigile' :
                      email.includes('admin') ? 'admin' : 'super-admin',
                statut: 'actif'
              };
            }
          }

          if (user) {
            resolve({
              data: {
                success: true,
                message: 'Connexion réussie',
                data: {
                  user: user,
                  token: 'mock-jwt-token-' + Date.now()
                }
              }
            });
          } else {
            resolve({
              data: {
                success: false,
                message: 'Email ou mot de passe incorrect'
              }
            });
          }
        }

        // Company request endpoint
        else if (endpoint === '/entreprises/request') {
          resolve({
            data: {
              success: true,
              message: 'Demande envoyée avec succès'
            }
          });
        }

        // Default response
        else {
          resolve({
            data: {
              success: true,
              message: 'Opération réussie'
            }
          });
        }
      }, 500);
    });
  },

  patch: (endpoint) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            success: true,
            message: 'Mise à jour réussie'
          }
        });
      }, 500);
    });
  },

  put: (endpoint) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            success: true,
            message: 'Modification réussie'
          }
        });
      }, 500);
    });
  },

  delete: (endpoint) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            success: true,
            message: 'Suppression réussie'
          }
        });
      }, 500);
    });
  }
};

// Use mock API instead of real API
const USE_MOCK_API = false;

if (USE_MOCK_API) {
  // Override axios methods with mock implementations
  api.get = mockAPI.get;
  api.post = mockAPI.post;
  api.patch = mockAPI.patch;
  api.put = mockAPI.put;
  api.delete = mockAPI.delete;
} else {
  // Intercepteur pour ajouter le token d'authentification
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur pour gérer les réponses et erreurs
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

// Services API

// Authentification
export const authAPI = {
  login: (email, motDePasse) => api.post('/auth/login', { email, motDePasse }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  switchCompany: (entrepriseId) => api.post('/auth/switch-company', { entrepriseId }),
  updateProfile: (userData) => api.patch('/auth/profile', userData),
};

// Entreprises
export const companiesAPI = {
  getAll: (params = {}) => api.get('/entreprises', { params }),
  getById: (id) => api.get(`/entreprises/${id}`),
  create: (companyData) => api.post('/entreprises', companyData),
  update: (id, companyData) => api.patch(`/entreprises/${id}`, companyData),
  delete: (id) => api.delete(`/entreprises/${id}`),
  toggleStatus: (id) => api.patch(`/entreprises/${id}/toggle-status`),
  getRequests: () => api.get('/entreprises/requests'),
  approveRequest: (id) => api.patch(`/entreprises/requests/${id}/approve`),
  rejectRequest: (id) => api.patch(`/entreprises/requests/${id}/reject`),
};

// Employés
export const employeesAPI = {
  getAll: (params = {}) => api.get('/employes', { params }),
  getById: (id) => api.get(`/employes/${id}`),
  create: (employeeData) => api.post('/employes', employeeData),
  update: (id, employeeData) => api.patch(`/employes/${id}`, employeeData),
  delete: (id) => api.delete(`/employes/${id}`),
  getByCompany: (companyId) => api.get(`/employes/company/${companyId}`),
};

// Utilisateurs
export const usersAPI = {
  getAll: (params = {}) => api.get('/utilisateurs', { params }),
  getById: (id) => api.get(`/utilisateurs/${id}`),
  getByEntrepriseId: (entrepriseId) => api.get(`/utilisateurs/entreprise/${entrepriseId}`),
  getAdminByEntrepriseId: (entrepriseId) => api.get(`/utilisateurs/admin/${entrepriseId}`),
  create: (userData) => api.post('/utilisateurs', userData),
  update: (id, userData) => api.put(`/utilisateurs/${id}`, userData),
  delete: (id) => api.delete(`/utilisateurs/${id}`),
  changePassword: (id, passwordData) => api.patch(`/utilisateurs/${id}/password`, passwordData),
};

// Cycles de paie
export const payrunsAPI = {
  getAll: (params = {}) => api.get('/payruns', { params }),
  getById: (id) => api.get(`/payruns/${id}`),
  create: (payrunData) => api.post('/payruns', payrunData),
  update: (id, payrunData) => api.patch(`/payruns/${id}`, payrunData),
  delete: (id) => api.delete(`/payruns/${id}`),
  approve: (id) => api.patch(`/payruns/${id}/approve`),
  generatePayslips: (id) => api.post(`/payruns/${id}/generate-payslips`),
  getByCompany: (companyId) => api.get(`/payruns/company/${companyId}`),
};

// Bulletins de paie
export const payslipsAPI = {
  getAll: (params = {}) => api.get('/payslips', { params }),
  getById: (id) => api.get(`/payslips/${id}`),
  create: (payslipData) => api.post('/payslips', payslipData),
  update: (id, payslipData) => api.patch(`/payslips/${id}`, payslipData),
  delete: (id) => api.delete(`/payslips/${id}`),
  getByEmployee: (employeeId) => api.get(`/payslips/employee/${employeeId}`),
  getByPayrun: (payrunId) => api.get(`/payslips/payrun/${payrunId}`),
  download: (id) => api.get(`/payslips/${id}/download`, { responseType: 'blob' }),
};

// Paiements
export const paymentsAPI = {
  getAll: (params = {}) => api.get('/paies', { params }),
  getById: (id) => api.get(`/paies/${id}`),
  create: (paymentData) => api.post('/paies', paymentData),
  update: (id, paymentData) => api.put(`/paies/${id}`, paymentData),
  delete: (id) => api.delete(`/paies/${id}`),
  getByCompany: (companyId) => api.get(`/paies/company/${companyId}`),
};

// Pointages
export const attendanceAPI = {
  checkIn: (data) => api.post('/employes/pointages', data),
  getTodayAttendance: (employeId) => api.get(`/employes/pointages/employe/${employeId}?startDate=${new Date().toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`),
  getCompanyTodayAttendance: (entrepriseId) => api.get(`/employes/pointages/entreprise/${entrepriseId}?startDate=${new Date().toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`),
  getAttendanceReport: (entrepriseId, startDate, endDate) => api.get(`/employes/pointages/entreprise/${entrepriseId}/report?startDate=${startDate}&endDate=${endDate}`),
  generateQRCode: (employeId) => api.get(`/employes/pointages/${employeId}/qr-code`),
  generateCompanyQRCode: (entrepriseId) => api.get(`/employes/pointages/entreprise/${entrepriseId}/qr-code`),
  validateQRCode: (data) => api.post('/employes/pointages/validate-qr', data),
  getStats: (params = {}) => api.get('/employes/pointages/stats', { params }),
  canCheckIn: (employeId, lat, lng) => {
    const params = lat && lng ? { lat, lng } : {};
    return api.get(`/employes/pointages/${employeId}/can-checkin`, { params });
  }
};

// Dashboard
export const dashboardAPI = {
  getAllData: () => api.get('/dashboard'),
  getStats: () => api.get('/dashboard/stats'),
  getFrequencyEvolution: () => api.get('/dashboard/frequency-evolution'),
  getUpcomingPayments: () => api.get('/dashboard/upcoming-payments'),
  getCompanyStats: (companyId) => api.get(`/dashboard/company/${companyId}/stats`),
};

// Marketing
export const marketingAPI = {
  getAllContent: () => api.get('/marketing'),
  getHeroContent: () => api.get('/marketing/hero'),
  getBenefits: () => api.get('/marketing/benefits'),
  getStats: () => api.get('/marketing/stats'),
  getCTAContent: () => api.get('/marketing/cta'),
  getContentBySection: (section) => api.get(`/marketing/${section}`),
};

export default api;