import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { entreprisesAPI } from '../services/api'
import {
    Building2, MapPin, Users, Plus, Search, Filter,
    Edit, Trash2, Phone, Mail, Briefcase, Eye,
    Download, TrendingUp, Award
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function EntreprisesList() {
    const navigate = useNavigate()
    const [entreprises, setEntreprises] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        actives: 0,
        inactives: 0,
        total_stagiaires: 0
    })
    const [filters, setFilters] = useState({
        search: '',
        secteur_activite: '',
        region: '',
        statut: ''
    })

    useEffect(() => {
        fetchEntreprises()
    }, [filters])

    useEffect(() => {
        calculateStats()
    }, [entreprises])

    const fetchEntreprises = async () => {
        try {
            setLoading(true)
            const response = await entreprisesAPI.getAll(filters)
            setEntreprises(response.data)
        } catch (error) {
            console.error('Error fetching entreprises:', error)
            toast.error('Erreur lors du chargement des entreprises')
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = () => {
        const actives = entreprises.filter(e => e.statut === 'Actif').length
        const inactives = entreprises.filter(e => e.statut === 'Inactif').length
        const total_stagiaires = entreprises.reduce((sum, e) => sum + (e.nombre_stagiaires_accueillis || 0), 0)

        setStats({
            total: entreprises.length,
            actives,
            inactives,
            total_stagiaires
        })
    }

    const exportToExcel = () => {
        const dataToExport = entreprises.map(e => ({
            Code: e.code,
            Nom: e.nom,
            Secteur: e.secteur_activite,
            Région: e.region,
            Ville: e.ville,
            Téléphone: e.telephone,
            Email: e.email,
            Responsable: e.responsable_nom,
            'Capacité Max': e.capacite_stagiaires_max,
            'Stagiaires Accueillis': e.nombre_stagiaires_accueillis,
            'Stages Actifs': e.nb_stages_actifs,
            'Taux Réussite': e.taux_reussite,
            Statut: e.statut
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Entreprises")
        XLSX.writeFile(wb, "entreprises_partenaires.xlsx")
        toast.success('Export Excel réussi')
    }

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cette entreprise ?')) {
            try {
                await entreprisesAPI.delete(id)
                toast.success('Entreprise supprimée')
                fetchEntreprises()
            } catch (error) {
                toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
            }
        }
    }

    const secteurs = [...new Set(entreprises.map(e => e.secteur_activite))].filter(Boolean)
    const regions = [...new Set(entreprises.map(e => e.region))].filter(Boolean)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Building2 className="w-8 h-8 text-purple-600" />
                                Entreprises Partenaires
                            </h1>
                            <p className="text-gray-600 mt-1">Gestion des entreprises d'accueil de stages</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Export Excel
                            </button>
                            <button
                                onClick={() => navigate('/entreprises/new')}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Nouvelle Entreprise
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Entreprises</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Building2 className="w-12 h-12 text-purple-600 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Actives</p>
                                <p className="text-3xl font-bold text-green-600">{stats.actives}</p>
                            </div>
                            <Award className="w-12 h-12 text-green-600 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Inactives</p>
                                <p className="text-3xl font-bold text-gray-400">{stats.inactives}</p>
                            </div>
                            <Building2 className="w-12 h-12 text-gray-400 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Stagiaires</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.total_stagiaires}</p>
                            </div>
                            <Users className="w-12 h-12 text-blue-600 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold">Filtres</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Search className="w-4 h-4 inline mr-1" />
                                Recherche
                            </label>
                            <input
                                type="text"
                                placeholder="Nom, code, ville..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
                            <select
                                value={filters.secteur_activite}
                                onChange={(e) => setFilters({ ...filters, secteur_activite: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Tous les secteurs</option>
                                {secteurs.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                            <select
                                value={filters.region}
                                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Toutes les régions</option>
                                {regions.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                            <select
                                value={filters.statut}
                                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="Actif">Actif</option>
                                <option value="Inactif">Inactif</option>
                                <option value="Suspendu">Suspendu</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Chargement...</p>
                        </div>
                    ) : entreprises.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Aucune entreprise trouvée</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stages</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {entreprises.map((entreprise) => (
                                        <tr key={entreprise.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                        <Building2 className="h-6 w-6 text-purple-600" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{entreprise.nom}</div>
                                                        <div className="text-sm text-gray-500">{entreprise.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                                                    {entreprise.secteur_activite || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    {entreprise.ville || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">{entreprise.region}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                    {entreprise.telephone || 'N/A'}
                                                </div>
                                                {entreprise.email && (
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {entreprise.email}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <span className="text-green-600 font-semibold">{entreprise.nb_stages_actifs || 0}</span>
                                                    <span className="text-gray-400"> / {entreprise.nb_stages || 0}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Total: {entreprise.nombre_stagiaires_accueillis || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    entreprise.statut === 'Actif' ? 'bg-green-100 text-green-800' :
                                                    entreprise.statut === 'Inactif' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {entreprise.statut}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/entreprises/${entreprise.id}`)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/entreprises/${entreprise.id}/edit`)}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entreprise.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
