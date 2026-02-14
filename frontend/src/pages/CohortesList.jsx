import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cohortesAPI, projectsAPI, centresAPI, locationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import {
    Eye, Edit, Trash2, Plus,
    Search, Filter, Download, FileSpreadsheet,
    Users, MapPin, Building2, Briefcase, Calendar,
    LayoutGrid, List as ListIcon, Map as MapIcon,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

export default function CohortesList() {
    const { user } = useAuth();
    const [cohortes, setCohortes] = useState([]);
    const [stats, setStats] = useState({ total: 0, en_cours: 0, terminees: 0, centres_uniques: 0, projets_uniques: 0 });
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'grid'

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        projet_id: '',
        centre_id: '',
        statut: '',
        region: '',
        page: 1,
        limit: 10
    });

    // Options for filters
    const [options, setOptions] = useState({
        projects: [],
        centres: [],
        regions: []
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        id: null,
        name: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchCohortes();
        fetchStats();
        loadFilterOptions();
    }, [filters]);

    const fetchCohortes = async () => {
        setLoading(true);
        try {
            const response = await cohortesAPI.getAll(filters);
            setCohortes(response.data.data);
            setPagination({
                currentPage: response.data.pagination.page,
                totalPages: response.data.pagination.totalPages,
                totalItems: response.data.pagination.total,
                itemsPerPage: response.data.pagination.limit
            });
        } catch (error) {
            console.error('Erreur chargement cohortes:', error);
            toast.error('Erreur lors du chargement des cohortes');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await cohortesAPI.getStats();
            setStats(res.data);
        } catch (error) {
            console.error('Erreur stats:', error);
        }
    };

    const loadFilterOptions = async () => {
        try {
            const [projRes, centreRes, locRes] = await Promise.all([
                projectsAPI.getAll({ limit: 100 }),
                centresAPI.getAll({ limit: 100 }),
                locationsAPI.getRegions()
            ]);
            setOptions({
                projects: Array.isArray(projRes.data) ? projRes.data : (projRes.data.data || []),
                centres: Array.isArray(centreRes.data) ? centreRes.data : (centreRes.data.data || []),
                regions: locRes.data || []
            });
        } catch (error) {
            console.error('Erreur chargement options:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const handleDeleteClick = (cohorte) => {
        setDeleteModal({ isOpen: true, id: cohorte.id, name: cohorte.nom });
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await cohortesAPI.delete(deleteModal.id);
            toast.success('Cohorte supprimée avec succès');
            setDeleteModal({ isOpen: false, id: null, name: '' });
            fetchCohortes();
            fetchStats();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        } finally {
            setIsDeleting(false);
        }
    };

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
    );

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Cohortes</h1>
                    <p className="text-gray-500 text-sm mt-1">Gérez les sessions de recrutement et formation</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => cohortesAPI.exportExcel()}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-bold text-sm"
                    >
                        <FileSpreadsheet size={18} />
                        <span>Export Excel</span>
                    </button>

                    {(user?.role === 'admin' || user?.role === 'gestionnaire') && (
                        <Link
                            to="/cohortes/new"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-bold text-sm"
                        >
                            <Plus size={18} />
                            <span>Nouvelle Cohorte</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Users} label="Total Cohortes" value={stats.total} color="bg-blue-50 text-blue-600" />
                <StatCard icon={Briefcase} label="En Cours" value={stats.en_cours} color="bg-green-50 text-green-600" />
                <StatCard icon={Calendar} label="Terminées" value={stats.terminees} color="bg-gray-50 text-gray-600" />
                <StatCard icon={Building2} label="Centres Liés" value={stats.centres_uniques} color="bg-purple-50 text-purple-600" />
                <StatCard icon={LayoutGrid} label="Projets Liés" value={stats.projets_uniques} color="bg-orange-50 text-orange-600" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, code..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <select
                            className="px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-sm min-w-[150px]"
                            value={filters.statut}
                            onChange={(e) => handleFilterChange('statut', e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="EN_COURS">En Cours</option>
                            <option value="TERMINEE">Terminée</option>
                        </select>
                        <select
                            className="px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-sm min-w-[150px]"
                            value={filters.projet_id}
                            onChange={(e) => handleFilterChange('projet_id', e.target.value)}
                        >
                            <option value="">Tous les projets</option>
                            {options.projects.map(p => (
                                <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                        </select>
                        <div className="border-l border-gray-200 h-8 mx-2 hidden md:block"></div>

                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <ListIcon size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
                </div>
            ) : cohortes.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune cohorte trouvée</h3>
                    <p className="text-gray-500">Essayez de modifier vos filtres ou créez une nouvelle cohorte.</p>
                </div>
            ) : viewMode === 'list' ? (
                /* LIST VIEW */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cohorte</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Projet / Centres</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Périodes</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cohortes.map((cohorte) => (
                                    <tr key={cohorte.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-gray-900">{cohorte.nom}</div>
                                                <div className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">
                                                    {cohorte.code || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-900">
                                                    <LayoutGrid size={14} className="text-gray-400" />
                                                    <span className="truncate max-w-[150px]" title={cohorte.projet_nom}>{cohorte.projet_nom}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500" title={cohorte.centres && cohorte.centres.map(c => c.nom).join(', ')}>
                                                    <Building2 size={12} />
                                                    <span>
                                                        {cohorte.centres && cohorte.centres.length > 0
                                                            ? `${cohorte.centres.length} Centre${cohorte.centres.length > 1 ? 's' : ''}`
                                                            : 'Aucun centre'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs space-y-1.5">
                                                <div className="flex items-center gap-1.5" title={`Recrutement: ${new Date(cohorte.date_debut_recrutement).toLocaleDateString()} - ${new Date(cohorte.date_fin_recrutement).toLocaleDateString()}`}>
                                                    <Users size={12} className="text-blue-500" />
                                                    <span className="text-gray-600">Recrute: </span>
                                                    <span className="font-medium text-gray-900">{cohorte.duree_recrutement}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5" title={`Formation: ${new Date(cohorte.date_entree_centre).toLocaleDateString()} - ${new Date(cohorte.date_fin_formation).toLocaleDateString()}`}>
                                                    <Briefcase size={12} className="text-purple-500" />
                                                    <span className="text-gray-600">Forme: </span>
                                                    <span className="font-medium text-gray-900">{cohorte.duree_formation}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cohorte.statut === 'EN_COURS'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cohorte.statut === 'EN_COURS' ? 'bg-green-500' : 'bg-gray-400'
                                                    }`}></div>
                                                {cohorte.statut === 'EN_COURS' ? 'En Cours' : 'Terminée'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link to={`/cohortes/${cohorte.id}`} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Eye size={16} />
                                                </Link>
                                                <Link to={`/cohortes/${cohorte.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClick(cohorte)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur {pagination.totalItems}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                disabled={filters.page === 1}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={filters.page >= pagination.totalPages}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cohortes.map((cohorte) => (
                        <div key={cohorte.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${cohorte.statut === 'EN_COURS' ? 'from-green-500 to-emerald-400' : 'from-gray-400 to-gray-300'
                                }`}></div>

                            <div className="flex justify-between items-start mb-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cohorte.statut === 'EN_COURS' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                    {cohorte.statut === 'EN_COURS' ? 'En Cours' : 'Terminée'}
                                </span>
                                <div className="flex gap-1">
                                    <Link to={`/cohortes/${cohorte.id}`} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50">
                                        <Eye size={16} />
                                    </Link>
                                    <Link to={`/cohortes/${cohorte.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                                        <Edit size={16} />
                                    </Link>
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-gray-900 mb-1">{cohorte.nom}</h3>
                            <div className="text-xs font-mono text-gray-400 mb-4">{cohorte.code}</div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <LayoutGrid size={16} className="text-gray-400" />
                                    <span className="truncate">{cohorte.projet_nom}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Building2 size={16} className="text-gray-400" />
                                    <span className="truncate">
                                        {cohorte.centres && cohorte.centres.length > 0
                                            ? `${cohorte.centres.length} Centre${cohorte.centres.length > 1 ? 's' : ''}`
                                            : 'Aucun centre'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin size={16} className="text-gray-400" />
                                    <span className="truncate">
                                        {cohorte.location_scope === 'GLOBAL' ? 'Zone Projet' : `${cohorte.localite}, ${cohorte.region}`}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Recrutement</div>
                                    <div className="text-xs font-bold text-gray-900">{cohorte.duree_recrutement}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Formation</div>
                                    <div className="text-xs font-bold text-gray-900">{cohorte.duree_formation}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Supprimer la cohorte"
                message="Êtes-vous sûr de vouloir supprimer cette cohorte ? Toutes les données associées seront archivées."
                itemName={deleteModal.name}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
                isDeleting={isDeleting}
            />
        </div>
    );
}
