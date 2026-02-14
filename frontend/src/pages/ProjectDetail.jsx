import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsAPI } from '../services/api'
import {
    ArrowLeft, Calendar, Clock, MapPin, Users, FileText, CheckCircle,
    AlertCircle, Building2, Download, Edit, Printer, TrendingUp, Globe,
    Target, Award, Shield, Briefcase, BookOpen, Layers, Activity
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function ProjectDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        fetchProject()
    }, [id])

    const fetchProject = async () => {
        try {
            setLoading(true)
            const res = await projectsAPI.getById(id)
            setProject(res.data)
        } catch (error) {
            console.error(error)
            navigate('/projects')
        } finally {
            setLoading(false)
        }
    }

    if (loading || !project) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Activity className="text-primary-600" size={24} />
                </div>
            </div>
        </div>
    )

    const getStatusTheme = (status) => {
        switch (status) {
            case 'EN_COURS': return {
                gradient: 'from-emerald-600 to-teal-500',
                shadow: 'shadow-emerald-200',
                badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                icon: 'text-emerald-500'
            }
            case 'PLANIFIE': return {
                gradient: 'from-blue-600 to-indigo-500',
                shadow: 'shadow-blue-200',
                badge: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: 'text-blue-500'
            }
            case 'CLOTURE': return {
                gradient: 'from-slate-700 to-gray-600',
                shadow: 'shadow-slate-200',
                badge: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: 'text-slate-500'
            }
            case 'SUSPENDU': return {
                gradient: 'from-rose-600 to-red-500',
                shadow: 'shadow-rose-200',
                badge: 'bg-rose-100 text-rose-700 border-rose-200',
                icon: 'text-rose-500'
            }
            default: return {
                gradient: 'from-gray-600 to-gray-500',
                shadow: 'shadow-gray-200',
                badge: 'bg-gray-100 text-gray-700 border-gray-200',
                icon: 'text-gray-500'
            }
        }
    }

    const theme = getStatusTheme(project.statut)

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-10 font-sans">

            <div className="max-w-7xl mx-auto px-6 space-y-8">

                {/* Compact Modern Header */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    {/* Decorative Top Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient}`}></div>

                    <div className="flex flex-col gap-6">
                        {/* Top Row: Back & Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <button
                                onClick={() => navigate('/projects')}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold text-xs bg-gray-50 px-3 py-1.5 rounded-full"
                            >
                                <ArrowLeft size={16} />
                                Retour aux projets
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-all border border-gray-100"
                                    title="Imprimer"
                                >
                                    <Printer size={16} />
                                </button>
                                <button
                                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-full hover:bg-gray-800 hover:shadow transition-all transform hover:-translate-y-0.5"
                                >
                                    <Edit size={14} />
                                    Modifier
                                </button>
                            </div>
                        </div>

                        {/* Middle: Title & Status */}
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-gray-200">
                                        {project.code}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${theme.badge} border`}>
                                        {project.statut?.replace('_', ' ')}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                                    {project.nom}
                                </h1>
                            </div>

                            {/* Dates & Duration Metadata */}
                            <div className="flex flex-col gap-2 min-w-[180px]">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <div className="p-1.5 bg-gray-50 rounded-md text-gray-400">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Période</div>
                                        <div className="text-xs font-bold text-gray-900">
                                            {new Date(project.date_debut).toLocaleDateString()} - {new Date(project.date_fin).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <div className="p-1.5 bg-gray-50 rounded-md text-gray-400">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Durée</div>
                                        <div className="text-xs font-bold text-gray-900">
                                            {project.duree_mois} mois
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3 Key Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:transform hover:-translate-y-0.5 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Target size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">KPI</span>
                        </div>
                        <div className="text-2xl font-black text-gray-900 mb-0.5">{project.cible_quantitative}</div>
                        <div className="text-xs font-medium text-gray-500">Bénéficiaires Ciblés</div>
                        <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full w-3/4 rounded-full"></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:transform hover:-translate-y-0.5 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">KPI</span>
                        </div>
                        <div className="text-2xl font-black text-gray-900 mb-0.5">{project.objectif_reclassement}%</div>
                        <div className="text-xs font-medium text-gray-500">Objectif Reclassement</div>
                        <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${project.objectif_reclassement}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:transform hover:-translate-y-0.5 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                <AlertCircle size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">LIMIT</span>
                        </div>
                        <div className="text-2xl font-black text-gray-900 mb-0.5">{project.taux_abandon_max}%</div>
                        <div className="text-xs font-medium text-gray-500">Seuil Max Abandon</div>
                        <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${project.taux_abandon_max}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Modern Pills Navigation */}
                <div className="flex justify-start mb-6">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 inline-flex flex-wrap gap-1">
                        {[
                            { id: 'overview', label: 'Vue d\'ensemble' },
                            { id: 'criteria', label: 'Critères & Avantages' },
                            { id: 'zones', label: 'Zones & Centres' },
                            { id: 'partners', label: 'Partenaires' },
                            { id: 'docs', label: 'Documents' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === tab.id
                                    ? `bg-gray-900 text-white shadow-md`
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dynamic Content Area */}
                <div className={`transition-all duration-300 ease-in-out`}>

                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                                            <FileText size={18} />
                                        </div>
                                        Description du Projet
                                    </h3>
                                    <div className="prose prose-sm text-gray-600 max-w-none">
                                        <p className="whitespace-pre-wrap leading-relaxed">
                                            {project.description || "Aucune description détaillée disponible pour ce projet."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Pays Ciblés</h3>
                                    <div className="flex flex-col gap-2">
                                        {project.pays_cible?.map((pays, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-100">
                                                <div className="text-xl shadow-sm rounded-full bg-white w-8 h-8 flex items-center justify-center">🌍</div>
                                                <span className="font-bold text-sm text-orange-900">{pays}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'criteria' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                        <CheckCircle size={18} />
                                    </div>
                                    Conditions d'Accès
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-lg font-black text-gray-900">
                                            {project.criteres_admission?.age_min}+
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Âge Requis</div>
                                            <div className="text-sm font-bold text-gray-900">
                                                De {project.criteres_admission?.age_min} à {project.criteres_admission?.age_max} ans
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                                            <Users className="text-gray-900" size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Genre Cible</div>
                                            <div className="text-sm font-bold text-gray-900">{project.genre_cible}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Niveau d'Études</div>
                                        <div className="flex flex-wrap gap-2">
                                            {project.criteres_admission?.niveau_scolaire?.map(n => (
                                                <span key={n} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                                                    {n}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl text-white">
                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                                        <Award size={18} />
                                    </div>
                                    Avantages
                                </h3>
                                <div className="grid gap-3">
                                    {project.avantages?.map((av, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="min-w-[20px] pt-0.5">
                                                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                                    <CheckCircle size={12} className="text-green-400" />
                                                </div>
                                            </div>
                                            <span className="font-medium text-white/90 leading-snug text-sm">{av}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'zones' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Improved Map Container */}
                            <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                                <div className="h-[300px] w-full rounded-xl overflow-hidden relative z-0">
                                    <MapContainer center={[7.539989, -5.54708]} zoom={6} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='OSM' />
                                        <Marker position={[7.54, -5.55]}>
                                            <Popup>{project.nom}</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            </div>

                            {/* Stats Summary Panel */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6">Couverture Géographique</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Régions', count: project.zones_intervention?.regions?.length, color: 'bg-blue-500' },
                                        { label: 'Départements', count: project.zones_intervention?.departements?.length, color: 'bg-indigo-500' },
                                        { label: 'Sous-Préfectures', count: project.zones_intervention?.sous_prefectures?.length, color: 'bg-violet-500' },
                                        { label: 'Localités', count: project.zones_intervention?.localites?.length, color: 'bg-purple-500' }
                                    ].map((item, i) => (
                                        <div key={i} className="relative overflow-hidden bg-gray-50 rounded-xl p-4 group hover:bg-white hover:shadow-lg transition-all border border-gray-100">
                                            <div className={`absolute top-0 right-0 w-16 h-16 ${item.color} opacity-5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform`}></div>
                                            <div className="text-2xl font-black text-gray-900 mb-1 relative z-10">{item.count || 0}</div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest relative z-10">{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Zones Cards */}
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                            <MapPin className="text-primary-500" size={16} />
                                            Détail des Zones
                                        </h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    <h4 className="font-bold text-gray-900 text-sm">Régions</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {project.zones_intervention?.regions?.map((r, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors cursor-default">
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                    <h4 className="font-bold text-gray-900 text-sm">Départements</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {project.zones_intervention?.departements?.map((d, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-default">
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                                    <h4 className="font-bold text-gray-900 text-sm">Sous-Préfectures</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {project.zones_intervention?.sous_prefectures?.map((s, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md text-xs font-semibold hover:bg-violet-100 transition-colors cursor-default">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                                    <h4 className="font-bold text-gray-900 text-sm">Localités</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {project.zones_intervention?.localites?.map((l, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold hover:bg-purple-100 transition-colors cursor-default">
                                                            {l}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Associated Centers List */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-gray-900 px-2">Centres de Service Civique</h3>
                                    {project.centres?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {project.centres.map(centre => (
                                                <div key={centre.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => navigate(`/centres/${centre.id}`)}>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                            <Building2 size={16} />
                                                        </div>
                                                        <div className="px-2 py-0.5 bg-gray-50 rounded-md text-[10px] font-mono font-bold text-gray-500">
                                                            {centre.code}
                                                        </div>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-primary-600 transition-colors">{centre.nom}</h4>
                                                    <div className="text-xs text-gray-500">Voir la fiche →</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
                                            <div className="text-gray-400 font-medium text-xs">Aucun centre associé à ce projet</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'partners' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Shield className="text-blue-500" size={18} />
                                    Bailleurs De Fonds
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.bailleurs?.map((b, i) => (
                                        <div key={i} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm border border-blue-100">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                            {b}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Users className="text-gray-500" size={18} />
                                    Partenaires d'Exécution
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.partenaires?.map((p, i) => (
                                        <div key={i} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm border border-gray-100">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                            {project.convention_url && (
                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${project.convention_url}`} target="_blank" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <FileText size={24} className="text-red-500 mb-3 relative z-10" />
                                    <h4 className="font-bold text-gray-900 text-sm mb-0.5 relative z-10">Convention Signée</h4>
                                    <div className="text-xs text-gray-500 mb-3 relative z-10">Document officiel PDF</div>
                                    <div className="inline-flex items-center gap-1 text-xs font-bold text-red-600 group-hover:underline">
                                        Télécharger <Download size={12} />
                                    </div>
                                </a>
                            )}

                            {project.tdr_url && (
                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${project.tdr_url}`} target="_blank" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <FileText size={24} className="text-blue-500 mb-3 relative z-10" />
                                    <h4 className="font-bold text-gray-900 text-sm mb-0.5 relative z-10">TDR Validés</h4>
                                    <div className="text-xs text-gray-500 mb-3 relative z-10">Termes de référence</div>
                                    <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:underline">
                                        Télécharger <Download size={12} />
                                    </div>
                                </a>
                            )}

                            {project.documents?.map((doc, i) => (
                                <a key={i} href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.chemin_fichier}`} target="_blank" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <FileText size={24} className="text-purple-500 mb-3 relative z-10" />
                                    <h4 className="font-bold text-gray-900 text-sm mb-0.5 relative z-10">{doc.nom_fichier}</h4>
                                    <div className="text-xs text-gray-500 mb-3 relative z-10">Ajouté le {new Date(doc.created_at).toLocaleDateString()}</div>
                                    <div className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:underline">
                                        Télécharger <Download size={12} />
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
