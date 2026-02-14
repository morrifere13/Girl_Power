import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { candidatesAPI, projectsAPI, cohortesAPI } from '../services/api'
import {
    Search, User, MapPin, Briefcase, Calendar, Filter, RefreshCw,
    Stethoscope, ChevronRight, Users, Building2, GraduationCap,
    Heart, X, CheckCircle
} from 'lucide-react'

export default function CandidatsVisiteMedicale() {
    const navigate = useNavigate()
    const [candidates, setCandidates] = useState([])
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState([])
    const [cohortes, setCohortes] = useState([])
    const [regions, setRegions] = useState([])
    const [metiers, setMetiers] = useState([])

    const [filters, setFilters] = useState({
        search: '',
        region: '',
        metier: '',
        projet_id: '',
        cohorte_id: '',
        sexe: ''
    })

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    })

    useEffect(() => {
        fetchCandidates()
        fetchProjects()
        fetchCohortes()
    }, [filters, pagination.page])

    const fetchCandidates = async () => {
        try {
            setLoading(true)
            const response = await candidatesAPI.getAll({
                statut: 'Sélectionné',
                search: filters.search,
                region: filters.region,
                metier: filters.metier,
                projet_id: filters.projet_id,
                cohorte_id: filters.cohorte_id,
                sexe: filters.sexe,
                page: pagination.page,
                limit: pagination.limit
            })

            const data = response.data.data || response.data
            setCandidates(data)
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || data.length
            }))

            // Extraire régions et métiers uniques
            const uniqueRegions = [...new Set(data.map(c => c.region).filter(Boolean))]
            const uniqueMetiers = [...new Set(data.map(c => c.metier_choisi).filter(Boolean))]
            setRegions(uniqueRegions)
            setMetiers(uniqueMetiers)

        } catch (error) {
            console.error('Erreur chargement:', error)
            toast.error('Erreur lors du chargement des candidats')
        } finally {
            setLoading(false)
        }
    }

    const fetchProjects = async () => {
        try {
            const response = await projectsAPI.getAll()
            setProjects(response.data.data || response.data || [])
        } catch (error) {
            console.error(error)
        }
    }

    const fetchCohortes = async () => {
        try {
            const response = await cohortesAPI.getAll()
            setCohortes(response.data.data || response.data || [])
        } catch (error) {
            console.error(error)
        }
    }

    const resetFilters = () => {
        setFilters({
            search: '',
            region: '',
            metier: '',
            projet_id: '',
            cohorte_id: '',
            sexe: ''
        })
    }

    const startVisiteMedicale = (candidateId) => {
        navigate(`/visites-medicales/new/${candidateId}`)
    }

    // Les filtres sont maintenant appliqués côté serveur
    const filteredCandidates = candidates

    const totalPages = Math.ceil(pagination.total / pagination.limit)

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <Stethoscope size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Candidats en attente de Visite Médicale</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                <span className="font-bold text-emerald-600">{filteredCandidates.length}</span> candidat(e)s sélectionné(e)s prêt(e)s pour la visite médicale
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { fetchCandidates() }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                        <RefreshCw size={18} />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Users size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{filteredCandidates.length}</p>
                            <p className="text-xs text-gray-500">Total à examiner</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                            <User size={20} className="text-pink-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{filteredCandidates.filter(c => c.sexe === 'F').length}</p>
                            <p className="text-xs text-gray-500">Femmes</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{filteredCandidates.filter(c => c.sexe === 'M').length}</p>
                            <p className="text-xs text-gray-500">Hommes</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <MapPin size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{regions.length}</p>
                            <p className="text-xs text-gray-500">Régions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-gray-500" />
                    <span className="font-bold text-gray-700">Filtres</span>
                    {(filters.search || filters.region || filters.metier || filters.projet_id || filters.cohorte_id || filters.sexe) && (
                        <button
                            onClick={resetFilters}
                            className="ml-auto flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                        >
                            <X size={14} />
                            Réinitialiser
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Recherche */}
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, prénom..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm"
                        />
                    </div>

                    {/* Région */}
                    <select
                        value={filters.region}
                        onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                        className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm"
                    >
                        <option value="">Toutes les régions</option>
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>

                    {/* Métier */}
                    <select
                        value={filters.metier}
                        onChange={(e) => setFilters({ ...filters, metier: e.target.value })}
                        className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm"
                    >
                        <option value="">Tous les métiers</option>
                        {metiers.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    {/* Projet */}
                    <select
                        value={filters.projet_id}
                        onChange={(e) => setFilters({ ...filters, projet_id: e.target.value })}
                        className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm"
                    >
                        <option value="">Tous les projets</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>

                    {/* Sexe */}
                    <select
                        value={filters.sexe}
                        onChange={(e) => setFilters({ ...filters, sexe: e.target.value })}
                        className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm"
                    >
                        <option value="">Tous</option>
                        <option value="F">Femmes</option>
                        <option value="M">Hommes</option>
                    </select>
                </div>
            </div>

            {/* Liste des candidats */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-600"></div>
                </div>
            ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Stethoscope size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun candidat en attente</h3>
                    <p className="text-gray-500">Aucun candidat sélectionné n'est en attente de visite médicale</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCandidates.map((candidate) => (
                        <div
                            key={candidate.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer overflow-hidden"
                            onClick={() => startVisiteMedicale(candidate.id)}
                        >
                            {/* Header coloré selon sexe */}
                            <div className={`h-2 ${candidate.sexe === 'F' ? 'bg-gradient-to-r from-pink-400 to-rose-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} />

                            <div className="p-5">
                                {/* Identité */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${candidate.sexe === 'F' ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                            }`}>
                                            {candidate.prenom?.charAt(0)}{candidate.nom?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{candidate.prenom} {candidate.nom}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>{candidate.sexe === 'F' ? 'Femme' : 'Homme'}</span>
                                                <span>•</span>
                                                <span>{candidate.age} ans</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">
                                        Sélectionné
                                    </span>
                                </div>

                                {/* Infos */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>{candidate.region || 'Non renseigné'}</span>
                                        {candidate.ville && <span>• {candidate.ville}</span>}
                                    </div>
                                    {candidate.metier_choisi && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Briefcase size={14} className="text-gray-400" />
                                            <span>{candidate.metier_choisi}</span>
                                        </div>
                                    )}
                                    {candidate.projet_nom && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <GraduationCap size={14} className="text-gray-400" />
                                            <span>{candidate.projet_nom}</span>
                                        </div>
                                    )}
                                    {candidate.centre_nom && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Building2 size={14} className="text-gray-400" />
                                            <span>{candidate.centre_nom}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        startVisiteMedicale(candidate.id)
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-bold text-sm group-hover:shadow-lg"
                                >
                                    <Stethoscope size={18} />
                                    Commencer la Visite Médicale
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Précédent
                    </button>
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg">
                        {pagination.page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                        disabled={pagination.page === totalPages}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Suivant
                    </button>
                </div>
            )}
        </div>
    )
}
