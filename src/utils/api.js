import axios from 'axios';

// Configuration de base d'Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3010/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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