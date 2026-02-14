import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { stagesAPI } from '../services/api'
import {
    Briefcase, Plus, Search, Filter, Calendar,
    Edit, Trash2, Eye, Download, Users, Building2,
    TrendingUp, CheckCircle, Clock, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function StagesList() {
    const navigate = useNavigate()
    const [stages, setStages] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        en_cours: 0,
        planifies: 0,
        termines: 0,
        abandonnes: 0
    })
    const [filters, setFilters] = useState({
        search: '',
        statut: '',
        type_stage: ''
    })

    useEffect(() => {
        fetchStages()
    }, [filters])

    useEffect(() => {
        calculateStats()
    }, [stages])

    const fetchStages = async () => {
        try {
            setLoading(true)
            const response = await stagesAPI.getAll(filters)
            setStages(response.data)
        } catch (error) {
            console.error('Error fetching stages:', error)
            toast.error('Erreur lors du chargement des stages')
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = () => {
        setStats({
            total: stages.length,
            en_cours: stages.filter(s => s.statut === 'En cours').length,
            planifies: stages.filter(s => s.statut === 'Planifié').length,
            termines: stages.filter(s => s.statut === 'Terminé').length,
            abandonnes: stages.filter(s => s.statut === 'Abandonné' || s.statut === 'Annulé').length
        })
    }

    const exportToExcel = () => {
        const dataToExport = stages.map(s => ({
            Code: s.code,
            'Candidate': `${s.candidate_prenom} ${s.candidate_nom}`,
            'Entreprise': s.entreprise_nom,
            'Secteur': s.secteur_activite,
            'Type': s.type_stage,
            'Métier': s.metier_stage,
            'Date Début': new Date(s.date_debut).toLocaleDateString('fr-FR'),
            'Date Fin': new Date(s.date_fin).toLocaleDateString('fr-FR'),
            'Durée (mois)': s.duree_mois,
            'Tuteur': s.tuteur_nom,
            'Note Entreprise': s.note_entreprise,
            'Taux Présence': s.taux_presence,
            'Statut': s.statut
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Stages")
        XLSX.writeFile(wb, "stages_girl_power.xlsx")
        toast.success('Export Excel réussi')
    }

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce stage ?')) {
            try {
                await stagesAPI.delete(id)
                toast.success('Stage supprimé')
                fetchStages()
            } catch (error) {
                toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
            }
        }
    }

    const getStatutBadge = (statut) => {
        const styles = {
            'Planifié': 'bg-blue-100 text-blue-800',
            'En cours': 'bg-green-100 text-green-800',
            'Terminé': 'bg-gray-100 text-gray-800',
            'Abandonné': 'bg-red-100 text-red-800',
            'Annulé': 'bg-orange-100 text-orange-800'
        }
        return styles[statut] || 'bg-gray-100 text-gray-800'
    }

    const getStatutIcon = (statut) => {
        switch (statut) {
            case 'En cours': return <CheckCircle className="w-4 h-4" />
            case 'Planifié': return <Clock className="w-4 h-4" />
            case 'Terminé': return <CheckCircle className="w-4 h-4" />
            case 'Abandonné':
            case 'Annulé': return <XCircle className="w-4 h-4" />
            default: return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Briefcase className="w-8 h-8 text-blue-600" />
                                Gestion des Stages
                            </h1>
                            <p className="text-gray-600 mt-1">Suivi des stages en entreprise</p>
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
                                onClick={() => navigate('/stages/new')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Nouveau Stage
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Briefcase className="w-12 h-12 text-blue-600 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">En Cours</p>
                                <p className="text-3xl font-bold text-green-600">{stats.en_cours}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Planifiés</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.planifies}</p>
                            </div>
                            <Clock className="w-12 h-12 text-blue-600 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Terminés</p>
                                <p className="text-3xl font-bold text-gray-600">{stats.termines}</p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-gray-600 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Abandonnés</p>
                                <p className="text-3xl font-bold text-red-600">{stats.abandonnes}</p>
                            </div>
                            <XCircle className="w-12 h-12 text-red-600 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold">Filtres</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Search className="w-4 h-4 inline mr-1" />
                                Recherche
                            </label>
                            <input
                                type="text"
                                placeholder="Code, candidate, entreprise..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                            <select
                                value={filters.statut}
                                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="Planifié">Planifié</option>
                                <option value="En cours">En cours</option>
                                <option value="Terminé">Terminé</option>
                                <option value="Abandonné">Abandonné</option>
                                <option value="Annulé">Annulé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type de Stage</label>
                            <select
                                value={filters.type_stage}
                                onChange={(e) => setFilters({ ...filters, type_stage: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous les types</option>
                                <option value="Stage pendant formation">Pendant formation</option>
                                <option value="Stage post-formation">Post-formation</option>
                                <option value="Stage insertion">Insertion professionnelle</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Chargement...</p>
                        </div>
                    ) : stages.length === 0 ? (
                        <div className="text-center py-12">
                            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Aucun stage trouvé</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type/Métier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stages.map((stage) => (
                                        <tr key={stage.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{stage.code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {stage.candidate_photo ? (
                                                            <img
                                                                src={stage.candidate_photo}
                                                                alt=""
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                                                                <Users className="h-6 w-6 text-pink-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {stage.candidate_prenom} {stage.candidate_nom}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                                    {stage.entreprise_nom}
                                                </div>
                                                <div className="text-xs text-gray-500">{stage.secteur_activite}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    {new Date(stage.date_debut).toLocaleDateString('fr-FR')}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    au {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                                                </div>
                                                <div className="text-xs text-blue-600">{stage.duree_mois} mois</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{stage.metier_stage}</div>
                                                <div className="text-xs text-gray-500">{stage.type_stage}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 ${getStatutBadge(stage.statut)}`}>
                                                    {getStatutIcon(stage.statut)}
                                                    {stage.statut}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/stages/${stage.id}`)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/stages/${stage.id}/edit`)}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(stage.id)}
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
