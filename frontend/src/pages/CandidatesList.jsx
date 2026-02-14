import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { candidatesAPI, API_BASE_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import {
  Eye, Edit, Trash2, X, Users, Clock, CheckCircle2, GraduationCap, XCircle,
  Search, Filter, Plus, ChevronLeft, ChevronRight, FileSpreadsheet, FileText,
  MapPin, Phone, Mail, Award, Building2, FolderOpen, Grid, List, LayoutGrid, Download, Check, Route
} from 'lucide-react'

export default function CandidatesList() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // 'list', 'grid', 'cards'
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    validees: 0,
    enFormation: 0,
    refusees: 0
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    ville: '',
    metier: '',
    diplome: '',
    type_document: '',
    statut: '',
    a_des_enfants: '',
    age_min: '',
    age_max: '',
    page: 1,
    limit: 10
  })
  const [filterOptions, setFilterOptions] = useState({
    regions: [],
    villes: [],
    metiers: [],
    diplomes: [],
    documents: []
  })

  useEffect(() => {
    fetchCandidates()
    loadFilterOptions()
  }, [filters])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const response = await candidatesAPI.getAll(filters)
      setCandidates(response.data.data)
      setPagination({
        currentPage: response.data.pagination.page,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.total,
        itemsPerPage: response.data.pagination.limit
      })

      const allCandidates = response.data.data
      setStats({
        total: response.data.pagination.total,
        inscrits: allCandidates.filter(c => c.statut === 'Inscrit').length,
        selectionnes: allCandidates.filter(c => c.statut === 'Sélectionné').length,
        aptes: allCandidates.filter(c => c.statut === 'Apte').length,
        admis: allCandidates.filter(c => c.statut === 'Admis').length,
        rejetes: allCandidates.filter(c => c.statut === 'Rejeté' || c.statut === 'Inapte').length
      })
    } catch (error) {
      console.error('Erreur chargement candidates:', error)
      toast.error('Erreur lors du chargement des candidates')
    } finally {
      setLoading(false)
    }
  }

  const loadFilterOptions = async () => {
    try {
      const response = await candidatesAPI.getFilters()
      setFilterOptions(response.data)
    } catch (error) {
      console.error('Erreur chargement filtres:', error)
    }
  }

  const [selectedCandidates, setSelectedCandidates] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/api/export/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'candidates.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Export Excel reussi !')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Erreur lors de l\'export Excel')
    }
  }

  // Export PDF individuel
  const handleExportPDFSingle = (id) => {
    const token = localStorage.getItem('token')
    window.open(`${API_BASE_URL}/api/candidates/export/pdf/${id}?token=${token}`, '_blank')
  }

  // Export PDF groupe (candidats selectionnes ou filtres)
  const handleExportPDFGroup = () => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    params.append('token', token)

    if (selectedCandidates.length > 0) {
      params.append('ids', selectedCandidates.join(','))
    } else {
      // Utiliser les filtres actifs
      if (filters.statut) params.append('statut', filters.statut)
      if (filters.region) params.append('region', filters.region)
    }
    window.open(`${API_BASE_URL}/api/candidates/export/pdf-group?${params.toString()}`, '_blank')
  }

  const toggleSelectCandidate = (id) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(candidates.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 })
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      region: '',
      ville: '',
      metier: '',
      diplome: '',
      type_document: '',
      statut: '',
      a_des_enfants: '',
      age_min: '',
      age_max: '',
      page: 1,
      limit: 10
    })
  }

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, candidateId: null, candidateName: '' })

  const confirmDelete = (candidate) => {
    setDeleteModal({
      isOpen: true,
      candidateId: candidate.id,
      candidateName: `${candidate.prenom} ${candidate.nom}`
    })
  }

  const handleDelete = async () => {
    if (!deleteModal.candidateId) return

    try {
      await candidatesAPI.delete(deleteModal.candidateId)
      toast.success('Candidate supprimée avec succès!')
      fetchCandidates()
      setDeleteModal({ isOpen: false, candidateId: null, candidateName: '' })
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Palette institutionnelle selon le parcours candidat
  const STATUT_CONFIG = {
    'Inscrit': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', icon: Clock },
    'Sélectionné': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', icon: CheckCircle2 },
    'Rejeté': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', icon: XCircle },
    'Apte': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', icon: CheckCircle2 },
    'Inapte': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', icon: XCircle },
    'Admis': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', icon: GraduationCap }
  }

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`${bgColor} w-14 h-14 rounded-lg flex items-center justify-center`}>
          <Icon size={28} className={color} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Institutionnel */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Stagiaires</h1>
                    <p className="text-sm text-gray-600 mt-0.5">Suivi et gestion des parcours de formation</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(user?.role === 'admin' || user?.role === 'gestionnaire') && (
                  <>
                    <button
                      onClick={handleExportPDFGroup}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                      title={selectedCandidates.length > 0 ? `Exporter ${selectedCandidates.length} fiche(s) PDF` : 'Exporter toutes les fiches PDF'}
                    >
                      <FileText size={18} />
                      <span className="hidden sm:inline">
                        {selectedCandidates.length > 0 ? `PDF (${selectedCandidates.length})` : 'Fiches PDF'}
                      </span>
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      <FileSpreadsheet size={18} />
                      <span className="hidden sm:inline">Excel</span>
                    </button>
                    <Link
                      to="/candidates/new"
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <Plus size={18} />
                      <span className="hidden sm:inline">Nouvelle Candidate</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={Users} label="Total" value={stats.total} color="text-blue-600" bgColor="bg-blue-50" />
            <StatCard icon={Clock} label="En attente" value={stats.enAttente} color="text-amber-600" bgColor="bg-amber-50" />
            <StatCard icon={CheckCircle2} label="Validées" value={stats.validees} color="text-green-600" bgColor="bg-green-50" />
            <StatCard icon={GraduationCap} label="En formation" value={stats.enFormation} color="text-blue-600" bgColor="bg-blue-50" />
            <StatCard icon={XCircle} label="Refusées" value={stats.refusees} color="text-red-600" bgColor="bg-red-50" />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-colors ${
                  showFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                <span>Filtres</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vue liste"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vue grille"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vue cartes"
                >
                  <Grid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  <option value="">Toutes les régions</option>
                  {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                  value={filters.statut}
                  onChange={(e) => handleFilterChange('statut', e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  {Object.keys(STATUT_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                  value={filters.diplome}
                  onChange={(e) => handleFilterChange('diplome', e.target.value)}
                >
                  <option value="">Tous les diplômes</option>
                  {filterOptions.diplomes.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <button
                  onClick={resetFilters}
                  className="px-4 py-2.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm border border-red-200"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 text-sm">Chargement des données...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Users size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Aucune candidate trouvée</h3>
            <p className="text-gray-600 mt-1 text-sm">Modifiez vos critères de recherche</p>
          </div>
        ) : viewMode === 'list' ? (
          /* Vue Liste (Tableau) */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Barre de selection */}
            {selectedCandidates.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                  <Check size={16} />
                  <span>{selectedCandidates.length} candidat(s) selectionne(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPDFGroup}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                  >
                    <Download size={14} />
                    Telecharger {selectedCandidates.length} fiche(s) PDF
                  </button>
                  <button
                    onClick={() => { setSelectedCandidates([]); setSelectAll(false) }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                  >
                    <X size={14} />
                    Annuler
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Tout selectionner"
                      />
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Candidate</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Formation</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Centre</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {candidates.map((candidate) => {
                    const statutConfig = STATUT_CONFIG[candidate.statut] || STATUT_CONFIG['Inscrit']
                    const StatusIcon = statutConfig.icon

                    return (
                      <tr key={candidate.id} className={`hover:bg-gray-50 transition-colors group ${selectedCandidates.includes(candidate.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-3 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCandidates.includes(candidate.id)}
                            onChange={() => toggleSelectCandidate(candidate.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {candidate.photo ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                <img
                                  src={`http://localhost:5000${candidate.photo}`}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                {candidate.prenom?.[0]}{candidate.nom?.[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{candidate.prenom} {candidate.nom}</p>
                              <p className="text-xs text-gray-500">ID: {candidate.id} • {candidate.age} ans</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone size={14} className="text-gray-400" />
                              <span>{candidate.telephone}</span>
                            </div>
                            {candidate.email && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Mail size={14} className="text-gray-400" />
                                <span className="truncate max-w-[180px]">{candidate.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                              <FolderOpen size={14} className="text-blue-600" />
                              <span className="truncate">{candidate.projet_nom || <span className="text-gray-400 italic">Aucun projet</span>}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <GraduationCap size={14} className="text-gray-400" />
                              <span className="truncate">{candidate.cohorte_nom || <span className="text-gray-400 italic">Aucune cohorte</span>}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Building2 size={14} className="text-gray-400" />
                              <span className="truncate">{candidate.centre_nom || <span className="text-gray-400 italic">Aucun centre</span>}</span>
                            </div>
                            {candidate.ville && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MapPin size={14} className="text-gray-400" />
                                <span>{candidate.ville}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border ${statutConfig.bg} ${statutConfig.text} ${statutConfig.border}`}>
                            <StatusIcon size={14} />
                            <span className="text-xs font-semibold">{candidate.statut}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleExportPDFSingle(candidate.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Telecharger fiche PDF"
                            >
                              <FileText size={16} />
                            </button>
                            <Link
                              to={`/candidates/${candidate.id}`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="Voir details"
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              to={`/parcours/${candidate.id}`}
                              className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-all"
                              title="Voir parcours"
                            >
                              <Route size={16} />
                            </Link>
                            {(user?.role === 'admin' || user?.role === 'gestionnaire') && (
                              <>
                                <Link
                                  to={`/candidates/${candidate.id}/edit`}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                  title="Modifier"
                                >
                                  <Edit size={16} />
                                </Link>
                                <button
                                  onClick={() => confirmDelete(candidate)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vue Grille (Compacte) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {candidates.map((candidate) => {
              const statutConfig = STATUT_CONFIG[candidate.statut] || STATUT_CONFIG['Inscrit']
              const StatusIcon = statutConfig.icon

              return (
                <div key={candidate.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3 mb-3">
                    {candidate.photo ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={`http://localhost:5000${candidate.photo}`} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {candidate.prenom?.[0]}{candidate.nom?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{candidate.prenom} {candidate.nom}</h3>
                      <p className="text-xs text-gray-500">{candidate.age} ans</p>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold mb-3 ${statutConfig.bg} ${statutConfig.text} ${statutConfig.border}`}>
                    <StatusIcon size={12} />
                    <span>{candidate.statut}</span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{candidate.telephone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{candidate.ville || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate text-xs">{candidate.centre_nom || 'Aucun centre'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                    <Link
                      to={`/candidates/${candidate.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors text-sm font-medium"
                    >
                      <Eye size={14} />
                      Voir
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'gestionnaire') && (
                      <>
                        <Link
                          to={`/candidates/${candidate.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => confirmDelete(candidate)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Vue Cartes (Détaillée) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => {
              const statutConfig = STATUT_CONFIG[candidate.statut] || STATUT_CONFIG['Inscrit']
              const StatusIcon = statutConfig.icon

              return (
                <div key={candidate.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-center gap-4">
                      {candidate.photo ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                          <img src={`http://localhost:5000${candidate.photo}`} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-white/20 border-2 border-white text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                          {candidate.prenom?.[0]}{candidate.nom?.[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{candidate.prenom} {candidate.nom}</h3>
                        <p className="text-blue-100 text-sm">ID: {candidate.id} • {candidate.age} ans</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border ${statutConfig.bg} ${statutConfig.text} ${statutConfig.border}`}>
                      <StatusIcon size={16} />
                      <span className="text-sm font-semibold">{candidate.statut}</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Téléphone</p>
                          <p className="text-sm font-medium text-gray-900">{candidate.telephone}</p>
                        </div>
                      </div>

                      {candidate.email && (
                        <div className="flex items-start gap-3">
                          <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{candidate.email}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <FolderOpen size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Projet</p>
                          <p className="text-sm font-medium text-gray-900">{candidate.projet_nom || 'Aucun projet'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <GraduationCap size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Cohorte</p>
                          <p className="text-sm font-medium text-gray-900">{candidate.cohorte_nom || 'Aucune cohorte'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Building2 size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Centre</p>
                          <p className="text-sm font-medium text-gray-900">{candidate.centre_nom || 'Aucun centre'}</p>
                          {candidate.ville && <p className="text-xs text-gray-500 mt-0.5">{candidate.ville}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <Link
                        to={`/candidates/${candidate.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                      >
                        <Eye size={16} />
                        Voir détails
                      </Link>
                      <Link
                        to={`/parcours/${candidate.id}`}
                        className="px-3 py-2 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-all"
                        title="Voir parcours"
                      >
                        <Route size={18} />
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'gestionnaire') && (
                        <>
                          <Link
                            to={`/candidates/${candidate.id}/edit`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => confirmDelete(candidate)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && candidates.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Affichage de <span className="font-semibold text-gray-900">{((filters.page - 1) * filters.limit) + 1}</span> à{' '}
              <span className="font-semibold text-gray-900">{Math.min(filters.page * filters.limit, pagination.totalItems || 0)}</span> sur{' '}
              <span className="font-semibold text-gray-900">{pagination.totalItems || 0}</span> candidates
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.max(1, Math.min(pagination.totalPages || 1, 5)))].map((_, i) => {
                  const totalPages = pagination.totalPages || 1
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (filters.page <= 3) {
                    pageNum = i + 1
                  } else if (filters.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = filters.page - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handleFilterChange('page', pageNum)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                        filters.page === pageNum
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page === (pagination.totalPages || 1)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 mb-2">
                  Êtes-vous sûr de vouloir supprimer
                </p>
                <p className="font-semibold text-gray-900 mb-3">
                  {deleteModal.candidateName} ?
                </p>
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200 mb-6">
                  Cette action est irréversible
                </p>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setDeleteModal({ isOpen: false, candidateId: null, candidateName: '' })}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
