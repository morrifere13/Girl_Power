import axios from 'axios'

// Base URL from env or default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = `${API_BASE_URL}/api`

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token expiration and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expiré ou invalide
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(new Error('Session expirée, veuillez vous reconnecter'))
    }

    // Forbidden - Pas les permissions
    if (error.response?.status === 403) {
      return Promise.reject(new Error('Accès non autorisé'))
    }

    // Not Found
    if (error.response?.status === 404) {
      return Promise.reject(new Error('Ressource non trouvée'))
    }

    // Server Error
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Erreur serveur, veuillez réessayer plus tard'))
    }

    // Autres erreurs
    return Promise.reject(error)
  }
)

export const candidatesAPI = {
  getAll: (params) => api.get('/candidates', { params }),
  getById: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  getFilters: () => api.get('/candidates/filters/options'),
  uploadPhoto: (id, file) => {
    const formData = new FormData()
    formData.append('photo', file)
    return api.post(`/candidates/upload-photo/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  uploadFichiers: (id, files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('fichiers', file)
    })
    return api.post(`/candidates/upload-fichiers/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  validate: (id, data) => api.put(`/candidates/${id}/validate`, data),
  rehabiliter: (id, data) => api.put(`/candidates/${id}/rehabiliter`, data),
  admettre: (id) => api.put(`/candidates/${id}/admettre`)
}

export const centresAPI = {
  getAll: (params) => api.get('/centres', { params }),
  getById: (id) => api.get(`/centres/${id}`),
  create: (data) => api.post('/centres', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/centres/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/centres/${id}`)
}

export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => {
    // Check if data is FormData
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post('/projects', data, config);
  },
  update: (id, data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.put(`/projects/${id}`, data, config);
  },
  delete: (id) => api.delete(`/projects/${id}`),
  exportExcel: () => {
    const token = localStorage.getItem('token');
    window.location.href = `${API_URL}/projects/export/excel?token=${token}`;
  },
  exportPDF: () => {
    const token = localStorage.getItem('token');
    window.location.href = `${API_URL}/projects/export/pdf?token=${token}`;
  },
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/projects/import/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}

export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
  getByRegion: (region) => api.get(`/stats/region/${region}`),
  getByVille: (ville) => api.get(`/stats/ville/${ville}`)
}

export const exportAPI = {
  exportExcel: () => {
    window.open(`${API_URL}/export/excel`, '_blank')
  },
  exportStats: () => {
    window.open(`${API_URL}/export/stats/excel`, '_blank')
  },
  importExcel: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/export/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export const locationsAPI = {
  getRegions: () => api.get('/locations/regions'),
  getDepartements: (region) => api.get(`/locations/departements/${encodeURIComponent(region)}`),
  getSousPrefectures: (departement) => api.get(`/locations/sous-prefectures/${encodeURIComponent(departement)}`),
  getLocalites: (sp) => api.get(`/locations/localites/${encodeURIComponent(sp)}`),
  getVilles: (region) => api.get(`/locations/villes/${encodeURIComponent(region)}`),
  search: (query) => {
    const params = new URLSearchParams({ q: query })
    return api.get(`/locations/search?${params}`)
  },
  searchVille: (query, region) => {
    const params = new URLSearchParams({ q: query })
    if (region) params.append('region', region)
    return api.get(`/locations/search-ville?${params}`)
  },
  getChefLieu: (region) => api.get(`/locations/chef-lieu/${encodeURIComponent(region)}`)
}

export const cohortesAPI = {
  getAll: (params) => api.get('/cohortes', { params }),
  getById: (id) => api.get(`/cohortes/${id}`),
  create: (data) => api.post('/cohortes', data),
  update: (id, data) => api.put(`/cohortes/${id}`, data),
  delete: (id) => api.delete(`/cohortes/${id}`),
  getStats: () => api.get('/cohortes/stats'),
  exportExcel: () => {
    const token = localStorage.getItem('token');
    window.location.href = `${API_URL}/cohortes/export/excel?token=${token}`;
  }
}

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  changePassword: (id, data) => api.put(`/users/${id}/password`, data)
}

export const entreprisesAPI = {
  getAll: (params) => api.get('/entreprises', { params }),
  getById: (id) => api.get(`/entreprises/${id}`),
  create: (data) => api.post('/entreprises', data),
  update: (id, data) => api.put(`/entreprises/${id}`, data),
  delete: (id) => api.delete(`/entreprises/${id}`),
  getStages: (id) => api.get(`/entreprises/${id}/stages`),
  getStatistiques: (id) => api.get(`/entreprises/${id}/statistiques`),
  getBySecteur: (secteur) => api.get(`/entreprises/secteur/${secteur}`)
}

export const stagesAPI = {
  getAll: (params) => api.get('/stages', { params }),
  getById: (id) => api.get(`/stages/${id}`),
  create: (data) => api.post('/stages', data),
  update: (id, data) => api.put(`/stages/${id}`, data),
  delete: (id) => api.delete(`/stages/${id}`),
  updateStatut: (id, data) => api.put(`/stages/${id}/statut`, data),
  addEvaluation: (id, data) => api.post(`/stages/${id}/evaluer`, data),
  getEvaluations: (id) => api.get(`/stages/${id}/evaluations`),
  getByCandidateId: (candidateId) => api.get(`/stages/candidate/${candidateId}`),
  getByEntrepriseId: (entrepriseId) => api.get(`/stages/entreprise/${entrepriseId}`)
}

export const formationsAPI = {
  getAll: (params) => api.get('/formations', { params }),
  getById: (id) => api.get(`/formations/${id}`),
  create: (data) => api.post('/formations', data),
  createBulk: (data) => api.post('/formations/bulk', data),
  update: (id, data) => api.put(`/formations/${id}`, data),
  delete: (id) => api.delete(`/formations/${id}`),
  abandon: (id, data) => api.put(`/formations/${id}/abandon`, data),
  terminer: (id, data) => api.put(`/formations/${id}/terminer`, data || {}),
  getStats: () => api.get('/formations/stats/overview'),
  getDossier: (candidateId) => api.get(`/formations/dossier/${candidateId}`)
}

export const visitesMedicalesAPI = {
  getAll: (params) => api.get('/visites-medicales', { params }),
  getById: (id) => api.get(`/visites-medicales/${id}`),
  create: (data) => api.post('/visites-medicales', data),
  update: (id, data) => api.put(`/visites-medicales/${id}`, data),
  delete: (id) => api.delete(`/visites-medicales/${id}`),
  getStats: (params) => api.get('/visites-medicales/stats/overview', { params }),
  getPendingCandidates: (params) => api.get('/visites-medicales/candidates/pending', { params }),
  exportExcel: (params) => {
    const token = localStorage.getItem('token')
    const queryParams = new URLSearchParams(params)
    window.location.href = `${API_URL}/visites-medicales/export/excel?${queryParams.toString()}&token=${token}`
  },
  exportPDF: (id) => {
    const token = localStorage.getItem('token')
    window.open(`${API_URL}/visites-medicales/export/pdf/${id}?token=${token}`, '_blank')
  }
}

export default api
