import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsAPI, locationsAPI } from '../services/api'
import ProjectCard from '../components/ProjectCard'
import {
    FolderOpen, Calendar, Clock, Plus, Search,
    Edit, Trash2, CheckCircle2, AlertCircle,
    LayoutGrid, List as ListIcon, Map as MapIcon,
    Download, Upload, Printer, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icons
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ProjectsList() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState('card') // 'card', 'list', 'map'
    const [showFilters, setShowFilters] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const printRef = useRef()

    // Print handler
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    })

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        statut: '',
        dateMin: '',
        dateMax: '',
        genre_cible: ''
    })

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const response = await projectsAPI.getAll(filters)
            setProjects(response.data)
        } catch (error) {
            console.error('Error fetching projects:', error)
            toast.error('Erreur chargement projets')
        } finally {
            setLoading(false)
        }
    }

    // Debounced search effect could be added here
    useEffect(() => {
        // Simple client-side filtering for now for responsiveness
        // Real app would fetch with filters from server
        // fetchProjects() 
    }, [filters])

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce projet ?')) {
            try {
                await projectsAPI.delete(id)
                toast.success('Projet supprimé')
                fetchProjects()
            } catch (error) {
                toast.error('Erreur suppression')
            }
        }
    }

    const handleImport = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setImportLoading(true)
            const res = await projectsAPI.importExcel(file)
            toast.success(`${res.data.imported} projets importés !`)
            if (res.data.errors > 0) toast.error(`${res.data.errors} erreurs ignorées`)
            fetchProjects()
        } catch (error) {
            toast.error('Erreur lors de l\'import')
            console.error(error)
        } finally {
            setImportLoading(false)
        }
    }

    // Advanced Filtering Logic (Client + API Hybrid potential)
    const getFilteredProjects = () => {
        return projects.filter(p => {
            const matchesSearch = p.nom?.toLowerCase().includes(filters.search.toLowerCase()) ||
                p.code?.toLowerCase().includes(filters.search.toLowerCase())
            const matchesStatus = filters.statut ? p.statut === filters.statut : true
            const matchesGenre = filters.genre_cible ? p.genre_cible === filters.genre_cible : true

            // Date filtering (simplified)
            const startAfter = filters.dateMin ? new Date(p.date_debut) >= new Date(filters.dateMin) : true
            const startBefore = filters.dateMax ? new Date(p.date_debut) <= new Date(filters.dateMax) : true

            return matchesSearch && matchesStatus && matchesGenre && startAfter && startBefore
        })
    }

    const filteredProjects = getFilteredProjects()

    // --- VIEW COMPONENTS ---

    const ListView = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider">Code</th>
                        <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider">Projet</th>
                        <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider">Dates</th>
                        <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider">Cible</th>
                        <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredProjects.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{p.code}</td>
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{p.nom}</div>
                                <div className="text-xs text-gray-500 line-clamp-1">{p.description}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${p.statut === 'EN_COURS' ? 'bg-green-100 text-green-700' :
                                    p.statut === 'PLANIFIE' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    {p.statut?.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                {new Date(p.date_debut).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <span className="font-bold">{p.cible_quantitative}</span> pers.
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => navigate(`/projects/${p.id}/edit`)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    const MapView = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[600px] z-0">
            <MapContainer center={[7.539989, -5.54708]} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {/* Mock Markers - In real app, we would enable geocoding of localities */}
                {filteredProjects.map(p => (
                    // Just random offset for demo if no coords
                    <Marker key={p.id} position={[7.54 + Math.random(), -5.55 + Math.random()]}>
                        <Popup>
                            <strong>{p.nom}</strong><br />
                            {p.statut}<br />
                            <button onClick={() => navigate(`/projects/${p.id}/edit`)}>Voir détail</button>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )

    // Print Version Component (Hidden usually)
    const PrintComponent = () => (
        <div ref={printRef} className="hidden print:block p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Rapport des Projets</h1>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="py-2">Code</th>
                        <th className="py-2">Nom du Projet</th>
                        <th className="py-2">Chrono</th>
                        <th className="py-2">Statut</th>
                        <th className="py-2 text-right">Cible</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProjects.map(p => (
                        <tr key={p.id} className="border-b border-gray-200">
                            <td className="py-2 font-mono text-sm">{p.code}</td>
                            <td className="py-2 font-bold">{p.nom}</td>
                            <td className="py-2 text-sm">{new Date(p.date_debut).toLocaleDateString()} - {new Date(p.date_fin).toLocaleDateString()}</td>
                            <td className="py-2 text-sm">{p.statut}</td>
                            <td className="py-2 text-sm text-right">{p.cible_quantitative}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-8 text-center text-sm text-gray-500">
                Généré depuis Girl Power App le {new Date().toLocaleDateString()}
            </div>
        </div>
    )

    // Calculate statistics
    const stats = {
        total: projects.length,
        enCours: projects.filter(p => p.statut === 'EN_COURS').length,
        planifies: projects.filter(p => p.statut === 'PLANIFIE').length,
        clotures: projects.filter(p => p.statut === 'CLOTURE').length,
        cibleTotale: projects.reduce((sum, p) => sum + (p.cible_quantitative || 0), 0)
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Header & Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Projets</h1>
                        <p className="text-sm text-gray-500 mt-1">Gérez vos programmes et initiatives</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/projects/new')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">Nouveau Projet</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* KPIs / Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Total Projets</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <FolderOpen size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">En Cours</p>
                            <p className="text-2xl font-black text-green-600 mt-1">{stats.enCours}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-xl">
                            <CheckCircle2 size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Planifiés</p>
                            <p className="text-2xl font-black text-blue-600 mt-1">{stats.planifies}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <Calendar size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Clôturés</p>
                            <p className="text-2xl font-black text-gray-600 mt-1">{stats.clotures}</p>
                        </div>
                        <div className="bg-gray-100 p-3 rounded-xl">
                            <Clock size={24} className="text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Cible Totale</p>
                            <p className="text-2xl font-black text-primary-600 mt-1">{stats.cibleTotale.toLocaleString()}</p>
                        </div>
                        <div className="bg-primary-50 p-3 rounded-xl">
                            <AlertCircle size={24} className="text-primary-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-30">

                {/* Search & Filters Toggle */}
                <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher (nom, code, ...)"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {/* Actions Group */}
                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                        <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`} title="Carte">
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`} title="Liste">
                            <ListIcon size={18} />
                        </button>
                        <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`} title="Carte Géo">
                            <MapIcon size={18} />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    {/* Export / Import / Print */}
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200" title="Exporter">
                                <Download size={18} />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-50">
                                <button onClick={() => projectsAPI.exportExcel()} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700">Exporter Excel</button>
                                <button onClick={() => projectsAPI.exportPDF()} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700">Exporter PDF</button>
                            </div>
                        </div>

                        <label className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 cursor-pointer" title="Importer Excel">
                            {importLoading ? <div className="animate-spin h-4.5 w-4.5 border-2 border-gray-400 border-t-primary-600 rounded-full" /> : <Upload size={18} />}
                            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} disabled={importLoading} />
                        </label>

                        <button
                            onClick={handlePrint}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                            title="Imprimer"
                        >
                            <Printer size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expandable Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideDown">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Statut</label>
                        <select
                            value={filters.statut}
                            onChange={e => setFilters({ ...filters, statut: e.target.value })}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="PLANIFIE">Planifié</option>
                            <option value="EN_COURS">En Cours</option>
                            <option value="CLOTURE">Clôturé</option>
                            <option value="SUSPENDU">Suspendu</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Genre Cible</label>
                        <select
                            value={filters.genre_cible}
                            onChange={e => setFilters({ ...filters, genre_cible: e.target.value })}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                        >
                            <option value="">Tous</option>
                            <option value="FEMME">Femmes Uniquement</option>
                            <option value="HOMME">Hommes Uniquement</option>
                            <option value="MIXTE">Mixte</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Date Début (Après)</label>
                        <input type="date" value={filters.dateMin} onChange={e => setFilters({ ...filters, dateMin: e.target.value })} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Date Début (Avant)</label>
                        <input type="date" value={filters.dateMax} onChange={e => setFilters({ ...filters, dateMax: e.target.value })} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                    </div>
                </div>
            )}

            {/* CONTENT */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="font-medium">Aucun projet trouvé</p>
                    <p className="text-sm mt-1">Essayez de modifier vos filtres ou créez un nouveau projet.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'card' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onDelete={handleDelete}
                                    onEdit={(id) => navigate(`/projects/${id}/edit`)}
                                />
                            ))}
                        </div>
                    )}

                    {viewMode === 'list' && <ListView />}
                    {viewMode === 'map' && <MapView />}
                </>
            )}

            {/* Hidden Print Component */}
            <div className="hidden">
                <PrintComponent />
            </div>
        </div>
    )
}
