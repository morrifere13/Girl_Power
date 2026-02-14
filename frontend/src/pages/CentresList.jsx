import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { centresAPI } from '../services/api'
import {
    Building2, MapPin, Users, Plus, Search,
    Edit, Trash2, Briefcase,
    LayoutGrid, List, Map as MapIcon, Download, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for Leaflet default icon issues in React
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function CentresList() {
    const navigate = useNavigate()
    const [centres, setCentres] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        actifs: 0,
        inactifs: 0,
        capacite_totale: 0,
        par_type: {}
    })
    const [filters, setFilters] = useState({
        search: '',
        region: '',
        type_centre: ''
    })

    useEffect(() => {
        fetchCentres()
    }, [filters])

    useEffect(() => {
        fetchStats()
    }, [centres])

    const fetchCentres = async () => {
        try {
            setLoading(true)
            const response = await centresAPI.getAll(filters)
            setCentres(response.data)
        } catch (error) {
            console.error('Error fetching centres:', error)
            toast.error('Erreur chargement des centres')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = () => {
        const actifs = centres.filter(c => c.statut === 'ACTIF').length
        const inactifs = centres.filter(c => c.statut === 'INACTIF').length
        const capacite_totale = centres.reduce((sum, c) => sum + (c.capacite_accueil || 0), 0)
        const par_type = centres.reduce((acc, c) => {
            acc[c.type_centre] = (acc[c.type_centre] || 0) + 1
            return acc
        }, {})
        
        setStats({
            total: centres.length,
            actifs,
            inactifs,
            capacite_totale,
            par_type
        })
    }

    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list' | 'map'

    const exportToExcel = () => {
        const dataToExport = centres.map(c => ({
            Code: c.code,
            Nom: c.nom,
            Type: c.type_centre,
            Région: c.region,
            Ville: c.ville,
            'Capacité': c.capacite_accueil,
            'Métiers': c.nb_metiers,
            Responsable: `${c.responsable_prenom || ''} ${c.responsable_nom || ''}`,
            Contact: c.responsable_contact,
            Statut: c.statut
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Centres")
        XLSX.writeFile(wb, "centres_service_civique.xlsx")
    }

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce centre ?')) {
            try {
                await centresAPI.delete(id)
                toast.success('Centre supprimé')
                fetchCentres()
            } catch (error) {
                toast.error('Erreur suppression')
            }
        }
    }

    const regions = [...new Set(centres.map(c => c.region))].filter(Boolean)
    const types = [...new Set(centres.map(c => c.type_centre))].filter(Boolean)

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-black text-gray-900">{value}</p>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Centres de Service Civique</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez les centres de formation et d'accueil</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-bold text-sm"
                    >
                        <Download size={18} />
                        <span>Export Excel</span>
                    </button>

                    <button
                        onClick={() => navigate('/centres/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-bold text-sm"
                    >
                        <Plus size={18} />
                        <span>Nouveau Centre</span>
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Building2} label="Total Centres" value={stats.total} color="bg-blue-50 text-blue-600" />
                <StatCard icon={Users} label="Centres Actifs" value={stats.actifs} color="bg-green-50 text-green-600" />
                <StatCard icon={MapPin} label="Centres Inactifs" value={stats.inactifs} color="bg-gray-50 text-gray-600" />
                <StatCard icon={Briefcase} label="Capacité Totale" value={stats.capacite_totale} color="bg-purple-50 text-purple-600" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher (nom, code, ville)..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={filters.region}
                            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                            className="px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-sm min-w-[150px]"
                        >
                            <option value="">Toutes les régions</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select
                            value={filters.type_centre}
                            onChange={(e) => setFilters({ ...filters, type_centre: e.target.value })}
                            className="px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-sm min-w-[150px]"
                        >
                            <option value="">Tous les types</option>
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="border-l border-gray-200 h-8 mx-2 hidden md:block"></div>

                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <MapIcon size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Views */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
                </div>
            ) : centres.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun centre trouvé</h3>
                    <p className="text-gray-500">Essayez de modifier vos filtres ou créez un nouveau centre.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {centres.map((centre) => (
                        <div key={centre.id} onClick={() => navigate(`/centres/${centre.id}`)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer">
                            {/* Gradient Banner */}
                            <div className="h-32 bg-gray-100 relative">
                                {centre.photo_url ? (
                                    <img
                                        src={`http://localhost:5000${centre.photo_url}`}
                                        alt={centre.nom}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${
                                        centre.statut === 'ACTIF' 
                                            ? 'bg-gradient-to-br from-green-50 to-green-100' 
                                            : 'bg-gradient-to-br from-gray-50 to-gray-100'
                                    }`}>
                                        <Building2 size={48} className={centre.statut === 'ACTIF' ? 'text-green-300' : 'text-gray-300'} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/centres/${centre.id}`); }}
                                        className="p-2 bg-white/90 rounded-full hover:text-primary-600 shadow-sm transition-colors"
                                        title="Voir"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/centres/${centre.id}/edit`); }}
                                        className="p-2 bg-white/90 rounded-full hover:text-blue-600 shadow-sm transition-colors"
                                        title="Modifier"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(centre.id); }}
                                        className="p-2 bg-white/90 rounded-full hover:text-red-600 shadow-sm transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                                            {centre.code}
                                        </span>
                                        <h3 className="text-lg font-black text-gray-900 leading-tight mt-1">
                                            {centre.nom}
                                        </h3>
                                    </div>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                                        centre.statut === 'ACTIF' 
                                            ? 'bg-green-50 text-green-700 border-green-100' 
                                            : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {centre.statut}
                                    </span>
                                </div>

                                <div className="space-y-2.5 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span>{centre.ville}, {centre.region}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Users size={16} className="text-gray-400" />
                                        <span>{centre.capacite_accueil} places</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Briefcase size={16} className="text-gray-400" />
                                        <span>{centre.nb_metiers} métiers formés</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Centre</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Localisation</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Capacité</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Métiers</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {centres.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {c.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {c.photo_url ? (
                                                    <img src={`http://localhost:5000${c.photo_url}`} className="w-10 h-10 rounded-xl object-cover border border-gray-100" alt="" />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                        c.statut === 'ACTIF' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        <Building2 size={18} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{c.nom}</div>
                                                    <div className="text-xs text-gray-500">{c.type_centre}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <MapPin size={14} className="text-gray-400" />
                                                <span>{c.ville}, {c.region}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Users size={14} className="text-gray-400" />
                                                <span className="font-medium">{c.capacite_accueil || 0} places</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Briefcase size={14} className="text-gray-400" />
                                                <span className="font-medium">{c.nb_metiers || 0} métiers</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                c.statut === 'ACTIF'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                    c.statut === 'ACTIF' ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></div>
                                                {c.statut}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => navigate(`/centres/${c.id}`)}
                                                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Voir"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/centres/${c.id}/edit`)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 h-[600px] overflow-hidden">
                    <MapContainer center={[7.54, -5.54]} zoom={7} scrollWheelZoom={false} className="h-full w-full rounded-xl z-0">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {centres.map(c => (
                            c.latitude && c.longitude ? (
                                <Marker key={c.id} position={[c.latitude, c.longitude]}>
                                    <Popup>
                                        <div className="text-center">
                                            <h4 className="font-bold text-gray-900 mb-1">{c.nom}</h4>
                                            <p className="text-xs text-gray-600 mb-2">{c.ville}</p>
                                            <button onClick={() => navigate(`/centres/${c.id}`)} className="text-xs text-primary-600 font-medium hover:underline">Voir détails</button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ) : null
                        ))}
                    </MapContainer>
                </div>
            )}
        </div>
    )
}
