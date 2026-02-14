import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'
import api, { API_BASE_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import {
    Activity, Search, Eye, Download, FileSpreadsheet, FileText,
    Users, CheckCircle, XCircle, Clock, User, Calendar, Plus,
    Filter, Grid3X3, List, Map, Edit, Trash2, Printer, Baby,
    ChevronLeft, ChevronRight, X, RefreshCw, MapPin, Phone,
    Building2, FolderOpen, Target, Heart, LayoutGrid, Table2,
    AlertTriangle, Bell
} from 'lucide-react'

// Statut colors
const STATUT_COLORS = {
    VALIDE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', dot: 'bg-green-500' },
    REJETE: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500' },
    EN_ATTENTE: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', dot: 'bg-yellow-500' }
}

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, subLabel }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all duration-300 group">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            {subLabel && <p className="text-xs text-gray-400">{subLabel}</p>}
        </div>
    </div>
)

export default function VisitesMedicalesPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const printRef = useRef()
    const canEdit = user?.role === 'admin' || user?.role === 'gestionnaire'

    // Data states
    const [visites, setVisites] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, valides: 0, rejetes: 0, en_attente: 0, grossesse: 0 })
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        statut: '',
        date_debut: '',
        date_fin: '',
        projet_id: '',
        cohorte_id: '',
        centre_id: '',
        region: '',
        ville: '',
        sexe: '',
        page: 1,
        limit: 20
    })

    // Filter options
    const [projets, setProjets] = useState([])
    const [cohortes, setCohortes] = useState([])
    const [centres, setCentres] = useState([])
    const [regions, setRegions] = useState([])
    const [villes, setVilles] = useState([])

    // UI states
    const [viewMode, setViewMode] = useState('list') // 'list', 'card', 'map'
    const [showFilters, setShowFilters] = useState(false)
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' })
    const [selectedItems, setSelectedItems] = useState([])

    // Fetch data
    useEffect(() => {
        fetchVisites()
        fetchStats()
    }, [filters])

    // Fetch filter options on mount
    useEffect(() => {
        fetchFilterOptions()
    }, [])

    // Fetch villes when region changes
    useEffect(() => {
        if (filters.region) {
            fetchVilles(filters.region)
        } else {
            setVilles([])
        }
    }, [filters.region])

    // Fetch cohortes when projet changes
    useEffect(() => {
        if (filters.projet_id) {
            fetchCohortesByProjet(filters.projet_id)
        }
    }, [filters.projet_id])

    const fetchVisites = async () => {
        try {
            setLoading(true)
            const response = await api.get('/visites-medicales', { params: filters })
            setVisites(response.data.data || response.data)
            if (response.data.pagination) {
                setPagination(response.data.pagination)
            }
        } catch (error) {
            toast.error('Erreur chargement visites')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const params = { ...filters }
            delete params.page
            delete params.limit
            delete params.search
            const response = await api.get('/visites-medicales/stats/overview', { params })
            setStats(response.data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const fetchFilterOptions = async () => {
        try {
            const [projetsRes, centresRes, regionsRes] = await Promise.all([
                api.get('/projects'),
                api.get('/centres'),
                api.get('/locations/regions')
            ])
            setProjets(projetsRes.data.data || projetsRes.data || [])
            setCentres(centresRes.data.data || centresRes.data || [])
            setRegions(regionsRes.data || [])
        } catch (error) {
            console.error('Error fetching filter options:', error)
        }
    }

    const fetchCohortesByProjet = async (projetId) => {
        try {
            const response = await api.get('/cohortes', { params: { project_id: projetId } })
            setCohortes(response.data.data || response.data || [])
        } catch (error) {
            console.error('Error fetching cohortes:', error)
        }
    }

    const fetchVilles = async (region) => {
        try {
            const response = await api.get(`/locations/villes/${encodeURIComponent(region)}`)
            setVilles(response.data || [])
        } catch (error) {
            console.error('Error fetching villes:', error)
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            statut: '',
            date_debut: '',
            date_fin: '',
            projet_id: '',
            cohorte_id: '',
            centre_id: '',
            region: '',
            ville: '',
            sexe: '',
            page: 1,
            limit: 20
        })
    }

    const handleDelete = async () => {
        try {
            await api.delete(`/visites-medicales/${deleteModal.id}`)
            toast.success('Visite médicale supprimée')
            setDeleteModal({ show: false, id: null, name: '' })
            fetchVisites()
            fetchStats()
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const handleExportExcel = () => {
        const token = localStorage.getItem('token')
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
            if (value && key !== 'page' && key !== 'limit') {
                params.append(key, value)
            }
        })
        window.location.href = `${API_BASE_URL}/api/visites-medicales/export/excel?${params.toString()}&token=${token}`
    }

    const handleExportPDF = (id) => {
        const token = localStorage.getItem('token')
        window.open(`${API_BASE_URL}/api/visites-medicales/export/pdf/${id}?token=${token}`, '_blank')
    }

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'Visites_Medicales'
    })

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(visites.map(v => v.id))
        } else {
            setSelectedItems([])
        }
    }

    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    // Render status badge
    const StatusBadge = ({ statut }) => {
        const colors = STATUT_COLORS[statut] || STATUT_COLORS.EN_ATTENTE
        const label = statut === 'VALIDE' ? 'Apte' : statut === 'REJETE' ? 'Inapte' : 'En attente'
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></div>
                {label}
            </span>
        )
    }

    // Card View Component
    const CardView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visites.map(visite => (
                <div key={visite.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
                                    {visite.photo ? (
                                        <img src={`${API_BASE_URL}${visite.photo}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} className="text-primary-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{visite.candidate_prenom} {visite.candidate_nom}</h3>
                                    <p className="text-xs text-gray-500">{visite.sexe === 'F' ? 'Femme' : 'Homme'}</p>
                                </div>
                            </div>
                            <StatusBadge statut={visite.statut} />
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar size={14} className="text-gray-400" />
                                <span>{visite.date_visite ? new Date(visite.date_visite).toLocaleDateString('fr-FR') : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Heart size={14} className="text-gray-400" />
                                <span>{visite.medecin_nom || 'N/A'}</span>
                            </div>
                            {visite.candidate_region && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={14} className="text-gray-400" />
                                    <span>{visite.candidate_ville}, {visite.candidate_region}</span>
                                </div>
                            )}
                            {visite.cohorte_nom && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <FolderOpen size={14} className="text-gray-400" />
                                    <span className="truncate">{visite.cohorte_nom}</span>
                                </div>
                            )}
                        </div>

                        {/* Grossesse indicator */}
                        {(visite.grossesse || visite.test_grossesse === 'POSITIF') && (
                            <div className="mt-3 flex items-center gap-2 text-pink-600 bg-pink-50 px-2 py-1 rounded-lg text-xs font-medium">
                                <Baby size={14} />
                                <span>Grossesse détectée</span>
                            </div>
                        )}
                        {/* Indicateur ancienneté en attente */}
                        {visite.statut === 'EN_ATTENTE' && visite.date_visite && (() => {
                            const days = Math.floor((Date.now() - new Date(visite.date_visite).getTime()) / 86400000)
                            if (days > 7) return (
                                <div className="mt-2 flex items-center gap-2 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-xs font-medium">
                                    <AlertTriangle size={14} />
                                    <span>En attente depuis {days} jours</span>
                                </div>
                            )
                            return null
                        })()}
                    </div>

                    {/* Actions - toujours visibles */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigate(`/visites-medicales/${visite.id}`)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Voir"
                            >
                                <Eye size={16} />
                            </button>
                            {canEdit && (
                                <>
                                    <button
                                        onClick={() => navigate(`/visites-medicales/${visite.id}/edit`)}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Modifier"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ show: true, id: visite.id, name: `${visite.candidate_prenom} ${visite.candidate_nom}` })}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => handleExportPDF(visite.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                            <FileText size={14} />
                            PDF
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )

    // List View Component
    const ListView = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.length === visites.length && visites.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Localisation</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cohorte</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Visite</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Médecin</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visites.map(visite => (
                            <tr key={visite.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(visite.id)}
                                        onChange={() => handleSelectItem(visite.id)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {visite.photo ? (
                                                <img src={`${API_BASE_URL}${visite.photo}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} className="text-primary-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{visite.candidate_prenom} {visite.candidate_nom}</div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{visite.sexe === 'F' ? 'Femme' : 'Homme'}</span>
                                                {(visite.grossesse || visite.test_grossesse === 'POSITIF') && (
                                                    <span className="flex items-center gap-1 text-pink-600">
                                                        <Baby size={12} />
                                                        Enceinte
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">{visite.candidate_ville || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">{visite.candidate_region || ''}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">{visite.cohorte_nom || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">{visite.centre_nom || ''}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                        <Calendar size={14} className="text-gray-400" />
                                        {visite.date_visite ? new Date(visite.date_visite).toLocaleDateString('fr-FR') : 'N/A'}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">{visite.medecin_nom || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">{visite.etablissement || ''}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <StatusBadge statut={visite.statut} />
                                        {visite.statut === 'EN_ATTENTE' && visite.date_visite && (() => {
                                            const days = Math.floor((Date.now() - new Date(visite.date_visite).getTime()) / 86400000)
                                            if (days > 7) return (
                                                <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                                    <Clock size={10} /> {days}j d'attente
                                                </span>
                                            )
                                            return null
                                        })()}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => navigate(`/visites-medicales/${visite.id}`)}
                                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            title="Voir"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {canEdit && (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/visites-medicales/${visite.id}/edit`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ show: true, id: visite.id, name: `${visite.candidate_prenom} ${visite.candidate_nom}` })}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleExportPDF(visite.id)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Exporter PDF"
                                        >
                                            <FileText size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )

    // Map View Component (placeholder - can be enhanced with actual map library)
    const MapView = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
                <Map size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Vue Carte</h3>
                <p className="text-gray-500 mb-4">Visualisation géographique des visites médicales par région</p>

                {/* Simple region summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {Object.entries(
                        visites.reduce((acc, v) => {
                            const region = v.candidate_region || 'Non définie'
                            acc[region] = (acc[region] || 0) + 1
                            return acc
                        }, {})
                    ).slice(0, 8).map(([region, count]) => (
                        <div key={region} className="bg-gray-50 rounded-xl p-3 text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin size={14} className="text-primary-500" />
                                <span className="text-sm font-medium text-gray-700 truncate">{region}</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">{count}</p>
                            <p className="text-xs text-gray-500">visites</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in p-6" ref={printRef}>
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <Activity className="text-primary-600" />
                            Visites Médicales
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Gestion et suivi des visites médicales des candidates validées</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* View mode toggle */}
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Vue liste"
                            >
                                <Table2 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Vue cartes"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Vue carte"
                            >
                                <Map size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium text-sm ${showFilters ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <Filter size={18} />
                            Filtres
                        </button>

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                            <Printer size={18} />
                            Imprimer
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-bold text-sm"
                        >
                            <FileSpreadsheet size={18} />
                            Export Excel
                        </button>

                        {canEdit && (
                            <>
                                <button
                                    onClick={() => navigate('/visites-medicales/candidats')}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-bold text-sm"
                                >
                                    <Users size={18} />
                                    Candidats à examiner
                                </button>
                                <button
                                    onClick={() => navigate('/visites-medicales/new')}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-bold text-sm"
                                >
                                    <Plus size={18} />
                                    Nouvelle Visite
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard icon={Users} label="Total Candidates" value={stats.total || 0} color="bg-blue-50 text-blue-600" />
                <StatCard icon={CheckCircle} label="Aptes" value={stats.valides || 0} color="bg-green-50 text-green-600" subLabel={stats.total > 0 ? `${Math.round(((stats.valides || 0) / stats.total) * 100)}% du total` : null} />
                <StatCard icon={XCircle} label="Inaptes" value={stats.rejetes || 0} color="bg-red-50 text-red-600" />
                <StatCard icon={Clock} label="En attente" value={stats.en_attente || 0} color="bg-yellow-50 text-yellow-600" subLabel={stats.en_attente > 0 ? 'Visites à planifier' : null} />
                <StatCard icon={Baby} label="Grossesses" value={stats.grossesse || 0} color="bg-pink-50 text-pink-600" subLabel={stats.grossesse > 0 ? 'Suivi requis' : null} />
            </div>

            {/* Alertes et suivi */}
            {((stats.grossesse > 0) || (stats.en_attente > 5)) && (
                <div className="space-y-3">
                    {/* Alerte grossesses */}
                    {stats.grossesse > 0 && (
                        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 flex items-start gap-3">
                            <div className="p-2 bg-pink-100 rounded-xl flex-shrink-0">
                                <Baby size={20} className="text-pink-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-pink-800 text-sm">Suivi grossesses - {stats.grossesse} cas détecté(s)</h3>
                                <p className="text-xs text-pink-700 mt-1">
                                    Ces candidates nécessitent un suivi médical particulier. Vérifiez que les aménagements nécessaires sont en place pour la formation.
                                </p>
                                <button
                                    onClick={() => { handleFilterChange('statut', ''); setShowFilters(false); }}
                                    className="mt-2 px-3 py-1 text-xs font-medium bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition inline-flex items-center gap-1"
                                >
                                    <Eye size={12} /> Voir les cas
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Alerte visites en attente */}
                    {stats.en_attente > 5 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-800 text-sm">{stats.en_attente} visites en attente de résultat</h3>
                                <p className="text-xs text-amber-700 mt-1">
                                    Un nombre important de visites médicales sont en attente. Pensez à relancer les établissements de santé pour obtenir les résultats.
                                </p>
                                <button
                                    onClick={() => handleFilterChange('statut', 'EN_ATTENTE')}
                                    className="mt-2 px-3 py-1 text-xs font-medium bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 transition inline-flex items-center gap-1"
                                >
                                    <Clock size={12} /> Filtrer les en attente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Filter size={18} className="text-gray-500" />
                            Filtres avancés
                        </h3>
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <RefreshCw size={14} />
                            Réinitialiser
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Nom, prénom, médecin..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Projet */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Projet</label>
                            <select
                                value={filters.projet_id}
                                onChange={(e) => handleFilterChange('projet_id', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                            >
                                <option value="">Tous les projets</option>
                                {projets.map(p => (
                                    <option key={p.id} value={p.id}>{p.nom}</option>
                                ))}
                            </select>
                        </div>

                        {/* Cohorte */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Cohorte</label>
                            <select
                                value={filters.cohorte_id}
                                onChange={(e) => handleFilterChange('cohorte_id', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                            >
                                <option value="">Toutes les cohortes</option>
                                {cohortes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nom}</option>
                                ))}
                            </select>
                        </div>

                        {/* Centre */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Centre</label>
                            <select
                                value={filters.centre_id}
                                onChange={(e) => handleFilterChange('centre_id', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                            >
                                <option value="">Tous les centres</option>
                                {centres.map(c => (
                                    <option key={c.id} value={c.id}>{c.nom}</option>
                                ))}
                            </select>
                        </div>

                        {/* Region */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Région</label>
                            <select
                                value={filters.region}
                                onChange={(e) => handleFilterChange('region', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                            >
                                <option value="">Toutes les régions</option>
                                {regions.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ville */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
                            <select
                                value={filters.ville}
                                onChange={(e) => handleFilterChange('ville', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                                disabled={!filters.region}
                            >
                                <option value="">Toutes les villes</option>
                                {villes.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sexe */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Sexe</label>
                            <select
                                value={filters.sexe}
                                onChange={(e) => handleFilterChange('sexe', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                            >
                                <option value="">Tous</option>
                                <option value="F">Femme</option>
                                <option value="M">Homme</option>
                            </select>
                        </div>

                        {/* Statut */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                            <select
                                value={filters.statut}
                                onChange={(e) => handleFilterChange('statut', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="VALIDE">Apte</option>
                                <option value="REJETE">Inapte</option>
                                <option value="EN_ATTENTE">En attente</option>
                            </select>
                        </div>

                        {/* Date début */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date début</label>
                            <input
                                type="date"
                                value={filters.date_debut}
                                onChange={(e) => handleFilterChange('date_debut', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                            />
                        </div>

                        {/* Date fin */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date fin</label>
                            <input
                                type="date"
                                value={filters.date_fin}
                                onChange={(e) => handleFilterChange('date_fin', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
                </div>
            ) : visites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Activity size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune visite médicale</h3>
                    <p className="text-gray-500 mb-4">Les visites médicales apparaîtront ici</p>
                    {canEdit && (
                        <button
                            onClick={() => navigate('/visites-medicales/new')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            <Plus size={18} />
                            Créer une visite
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'list' && <ListView />}
                    {viewMode === 'card' && <CardView />}
                    {viewMode === 'map' && <MapView />}
                </>
            )}

            {/* Pagination */}
            {!loading && visites.length > 0 && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">
                        Affichage de {((pagination.page - 1) * filters.limit) + 1} à {Math.min(pagination.page * filters.limit, pagination.total)} sur {pagination.total} résultats
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum
                            if (pagination.totalPages <= 5) {
                                pageNum = i + 1
                            } else if (pagination.page <= 3) {
                                pageNum = i + 1
                            } else if (pagination.page >= pagination.totalPages - 2) {
                                pageNum = pagination.totalPages - 4 + i
                            } else {
                                pageNum = pagination.page - 2 + i
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                        pagination.page === pageNum
                                            ? 'bg-primary-600 text-white'
                                            : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null, name: '' })}
                onConfirm={handleDelete}
                title="Supprimer la visite médicale"
                message={`Êtes-vous sûr de vouloir supprimer la visite médicale de ${deleteModal.name} ? Cette action est irréversible.`}
            />
        </div>
    )
}
