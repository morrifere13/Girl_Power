import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { centresAPI } from '../services/api'
import {
    Building2, MapPin, Phone, Mail, User, Briefcase,
    Calendar, CheckCircle, ArrowLeft, Edit, Printer,
    Users, Activity, Globe, GraduationCap, Layout
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function CentreDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [centre, setCentre] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('infos')

    useEffect(() => {
        fetchCentre()
    }, [id])

    const fetchCentre = async () => {
        try {
            setLoading(true)
            const res = await centresAPI.getById(id)
            const data = res.data

            // Sanitize Metiers in case of double-encoded JSON strings from DB
            if (data.metiers && Array.isArray(data.metiers)) {
                let cleanMetiers = []
                data.metiers.forEach(m => {
                    if (typeof m.metier_choisi === 'string' && m.metier_choisi.trim().startsWith('[')) {
                        try {
                            const parsed = JSON.parse(m.metier_choisi)
                            if (Array.isArray(parsed)) {
                                parsed.forEach(pm => cleanMetiers.push({ ...m, metier_choisi: pm }))
                            } else {
                                cleanMetiers.push(m)
                            }
                        } catch (e) {
                            cleanMetiers.push(m)
                        }
                    } else {
                        cleanMetiers.push(m)
                    }
                })
                // Deduplicate
                data.metiers = cleanMetiers.filter((m, index, self) =>
                    index === self.findIndex((t) => (t.metier_choisi === m.metier_choisi))
                )
            }
            setCentre(data)
        } catch (error) {
            console.error(error)
            navigate('/centres')
        } finally {
            setLoading(false)
        }
    }

    if (loading || !centre) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
            </div>
        </div>
    )

    // Helper for Status Badge
    const getStatusTheme = (statut) => {
        return statut === 'ACTIF'
            ? { badge: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' }
            : { badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' }
    }
    const theme = getStatusTheme(centre.statut)

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-10 font-sans">
            <div className="max-w-7xl mx-auto px-6 space-y-8">

                {/* Header Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

                    <div className="flex flex-col gap-6">
                        {/* Top Row */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <button
                                onClick={() => navigate('/centres')}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold text-xs bg-gray-50 px-3 py-1.5 rounded-full"
                            >
                                <ArrowLeft size={16} />
                                Retour à la liste
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-all border border-gray-100"
                                >
                                    <Printer size={16} />
                                </button>
                                <button
                                    onClick={() => navigate(`/centres/${centre.id}/edit`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-full hover:bg-gray-800 hover:shadow transition-all transform hover:-translate-y-0.5"
                                >
                                    <Edit size={14} />
                                    Modifier
                                </button>
                            </div>
                        </div>

                        {/* Middle Info */}
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-gray-200">
                                        {centre.code}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border flex items-center gap-1.5 ${theme.badge}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></div>
                                        {centre.statut}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-100">
                                        {centre.type_centre}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-2">
                                    {centre.nom}
                                </h1>
                                <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                                    <MapPin size={16} />
                                    {centre.ville}, {centre.region}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex flex-col gap-2 min-w-[180px]">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="p-1.5 bg-gray-50 rounded-md text-gray-400">
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Capacité</div>
                                        <div className="text-sm font-bold text-gray-900">{centre.capacite_accueil} places</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="p-1.5 bg-gray-50 rounded-md text-gray-400">
                                        <Layout size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Projets</div>
                                        <div className="text-sm font-bold text-gray-900">{centre.projects?.length || 0} actifs</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-start">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 inline-flex flex-wrap gap-1">
                        {[
                            { id: 'infos', label: 'Informations' },
                            { id: 'formations', label: 'Formations & Métiers' },
                            { id: 'projets', label: 'Projets Rattachés' }
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

                {/* Content */}
                <div className="animate-fadeIn">

                    {/* INFO TAB */}
                    {/* INFO TAB */}
                    {activeTab === 'infos' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                        <Building2 className="text-blue-500" size={20} />
                                        Présentation
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">
                                        {centre.description || "Aucune description renseignée pour ce centre."}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                Responsable
                                            </h4>
                                            <div className="space-y-1">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {centre.responsable_prenom} {centre.responsable_nom?.toUpperCase()}
                                                </div>
                                                <div className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded border inline-block">
                                                    {centre.responsable_fonction}
                                                </div>
                                                <div className="pt-2 flex flex-col gap-1 text-xs text-gray-600">
                                                    {centre.responsable_email_pro && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail size={12} /> {centre.responsable_email_pro}
                                                        </div>
                                                    )}
                                                    {centre.responsable_contact && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone size={12} /> {centre.responsable_contact}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                                <MapPin size={16} className="text-gray-400" />
                                                Coordonnées
                                            </h4>
                                            <div className="space-y-2 text-xs">
                                                <div>
                                                    <span className="text-gray-400 text-[10px] font-bold uppercase block">Adresse</span>
                                                    <span className="font-medium text-gray-900">{centre.adresse || 'Non renseignée'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 text-[10px] font-bold uppercase block">Contact Centre</span>
                                                    <span className="font-medium text-gray-900">{centre.telephone || '-'}</span>
                                                </div>
                                                {centre.email && (
                                                    <div>
                                                        <span className="text-gray-400 text-[10px] font-bold uppercase block">Email</span>
                                                        <span className="font-medium text-gray-900">{centre.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
                                    <div className="h-[250px] w-full rounded-xl overflow-hidden relative z-0">
                                        <MapContainer center={[centre.latitude || 7.54, centre.longitude || -5.55]} zoom={10} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='OSM' />
                                            {(centre.latitude && centre.longitude) && (
                                                <Marker position={[centre.latitude, centre.longitude]}>
                                                    <Popup>{centre.nom}</Popup>
                                                </Marker>
                                            )}
                                        </MapContainer>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-sm font-black text-gray-900 mb-4">Équipements</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                            <span className="font-medium text-gray-700">Crèche</span>
                                            {centre.creche ? <CheckCircle size={16} className="text-green-500" /> : <span className="text-gray-400 text-xs">Non</span>}
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                            <span className="font-medium text-gray-700">Eau Courante</span>
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                            <span className="font-medium text-gray-700">Électricité</span>
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FORMATIONS TAB */}
                    {activeTab === 'formations' && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <GraduationCap className="text-blue-500" size={20} />
                                    Filières & Métiers
                                </h3>
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold text-xs">
                                    {centre.metiers?.length || 0} filières dispensées
                                </span>
                            </div>

                            {centre.metiers?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {centre.metiers.map((m, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-gray-50 border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all group flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 group-hover:scale-105 transition-transform">
                                                <Briefcase size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">{m.metier_choisi}</h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <GraduationCap size={32} className="mx-auto text-gray-300 mb-2" />
                                    <div className="font-bold text-xs text-gray-400">Aucune filière renseignée.</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROJETS TAB */}
                    {activeTab === 'projets' && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <Activity className="text-purple-500" size={20} />
                                    Projets Associés
                                </h3>
                                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-bold text-xs">
                                    {centre.projects?.length || 0} projets
                                </span>
                            </div>

                            {centre.projects?.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {centre.projects.map(prj => (
                                        <div key={prj.id} onClick={() => navigate(`/projects/${prj.id}`)} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-gray-100 cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-xs font-black text-gray-900 group-hover:text-purple-600 transition-colors">
                                                    {prj.code?.split('-')[2] || 'PRJ'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-mono">
                                                            {prj.code}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prj.statut === 'EN_COURS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {prj.statut?.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{prj.nom}</h4>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        Du {new Date(prj.date_debut).toLocaleDateString()} au {new Date(prj.date_fin).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden md:block text-right">
                                                <div className="text-lg font-black text-gray-900">{prj.cible_quantitative || 0}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cible</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Activity size={32} className="mx-auto text-gray-300 mb-2" />
                                    <div className="font-bold text-xs text-gray-400">Ce centre n'est rattaché à aucun projet actif.</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
