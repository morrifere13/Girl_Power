import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { cohortesAPI } from '../services/api'
import {
    ArrowLeft, Edit, Trash2, Printer, Download,
    LayoutGrid, Building2, MapPin, Calendar, Users,
    CheckCircle, Clock, FileText, AlertCircle, Briefcase
} from 'lucide-react'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'

export default function CohorteDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [cohorte, setCohorte] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    const [deleteModal, setDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        fetchCohorte()
    }, [id])

    const fetchCohorte = async () => {
        try {
            setLoading(true)
            const res = await cohortesAPI.getById(id)
            setCohorte(res.data)
        } catch (error) {
            console.error(error)
            // navigate('/cohortes')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await cohortesAPI.delete(id)
            navigate('/cohortes')
        } catch (error) {
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

    const handlePrint = () => window.print()

    const handleExportPDF = () => {
        // TODO: Implement real PDF export or link to backend endpoint
        window.print()
    }

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
        </div>
    )

    if (!cohorte) return null

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutGrid },
        { id: 'candidates', label: 'Candidates', icon: Users },
        { id: 'planning', label: 'Calendrier', icon: Calendar },
        { id: 'docs', label: 'Documents', icon: FileText },
    ]

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-10 font-sans animate-fade-in">
            <div className="max-w-7xl mx-auto px-6 space-y-8">

                {/* Header Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${cohorte.statut === 'EN_COURS' ? 'from-green-500 to-emerald-400' : 'from-gray-400 to-gray-300'
                        }`}></div>

                    <div className="flex flex-col gap-6">
                        {/* Top Row */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <button onClick={() => navigate('/cohortes')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold text-xs bg-gray-50 px-3 py-1.5 rounded-full">
                                <ArrowLeft size={16} />
                                Retour à la liste
                            </button>

                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-all border border-gray-100">
                                    <Printer size={16} />
                                </button>
                                <button onClick={handleExportPDF} className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-all border border-gray-100">
                                    <Download size={16} />
                                </button>
                                <Link to={`/cohortes/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-full hover:bg-gray-800 hover:shadow transition-all transform hover:-translate-y-0.5">
                                    <Edit size={14} />
                                    Modifier
                                </Link>
                                <button onClick={() => setDeleteModal(true)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-all border border-red-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Middle Info */}
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-gray-200">
                                        {cohorte.code || 'N/A'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border flex items-center gap-1.5 ${cohorte.statut === 'EN_COURS' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${cohorte.statut === 'EN_COURS' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        {cohorte.statut === 'EN_COURS' ? 'En Cours' : 'Terminée'}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-2">
                                    {cohorte.nom}
                                </h1>
                                <div className="flex items-center gap-4 text-gray-500 font-medium text-sm flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid size={16} className="text-gray-400" />
                                        {cohorte.projet_nom}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-gray-400" />
                                        {cohorte.centres && cohorte.centres.length > 0
                                            ? `${cohorte.centres.length} Centre${cohorte.centres.length > 1 ? 's' : ''}`
                                            : 'Aucun centre'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-gray-400" />
                                        {cohorte.zones_intervention && cohorte.zones_intervention.length > 0
                                            ? `${cohorte.zones_intervention.length} zone${cohorte.zones_intervention.length > 1 ? 's' : ''}`
                                            : (cohorte.location_scope === 'GLOBAL' ? 'Zone Projet' : `${cohorte.localite}, ${cohorte.region}`)}
                                    </div>
                                </div>
                                {/* Centres List Badge */}
                                {cohorte.centres && cohorte.centres.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {cohorte.centres.map(c => (
                                            <span key={c.id} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-200 font-medium flex items-center gap-1">
                                                <Building2 size={10} />
                                                {c.nom}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {/* Zones List Badge */}
                                {cohorte.zones_intervention && typeof cohorte.zones_intervention === 'object' && (
                                    <div className="mt-3">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zones d'Intervention</div>
                                        <div className="space-y-2">
                                            {cohorte.zones_intervention.regions && cohorte.zones_intervention.regions.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] text-gray-400 mb-1">Régions:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {cohorte.zones_intervention.regions.map((r, idx) => (
                                                            <span key={idx} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200 font-medium">
                                                                📍 {r}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {cohorte.zones_intervention.departements && cohorte.zones_intervention.departements.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] text-gray-400 mb-1">Départements:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {cohorte.zones_intervention.departements.map((d, idx) => (
                                                            <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-medium">
                                                                🏛️ {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {cohorte.zones_intervention.sous_prefectures && cohorte.zones_intervention.sous_prefectures.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] text-gray-400 mb-1">Sous-préfectures:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {cohorte.zones_intervention.sous_prefectures.map((sp, idx) => (
                                                            <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 font-medium">
                                                                🏘️ {sp}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {cohorte.zones_intervention.localites && cohorte.zones_intervention.localites.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] text-gray-400 mb-1">Localités:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {cohorte.zones_intervention.localites.map((l, idx) => (
                                                            <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-medium">
                                                                📌 {l}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-t border-gray-100 -mx-6 px-6 pt-4">
                            <nav className="flex gap-1 overflow-x-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                  px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2
                                  ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                               `}
                                        >
                                            <Icon size={14} />
                                            {tab.label}
                                        </button>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 gap-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">

                            {/* Dates Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Calendar size={18} />
                                    </div>
                                    Périodes & Durées
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-gray-900">Phase de Recrutement</span>
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">{cohorte.duree_recrutement}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex-1">
                                                <div className="text-[10px] uppercase text-gray-400 font-bold">Début</div>
                                                <div>{new Date(cohorte.date_debut_recrutement).toLocaleDateString()}</div>
                                            </div>
                                            <ArrowLeft size={16} className="text-gray-300" />
                                            <div className="flex-1 text-right">
                                                <div className="text-[10px] uppercase text-gray-400 font-bold">Fin</div>
                                                <div>{new Date(cohorte.date_fin_recrutement).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-gray-900">Phase de Formation</span>
                                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">{cohorte.duree_formation}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex-1">
                                                <div className="text-[10px] uppercase text-gray-400 font-bold">Entrée</div>
                                                <div>{new Date(cohorte.date_entree_centre).toLocaleDateString()}</div>
                                            </div>
                                            <ArrowLeft size={16} className="text-gray-300" />
                                            <div className="flex-1 text-right">
                                                <div className="text-[10px] uppercase text-gray-400 font-bold">Fin</div>
                                                <div>{new Date(cohorte.date_fin_formation).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <Users size={18} />
                                    </div>
                                    Effectifs
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        <div className="text-3xl font-black text-gray-900 mb-1">{cohorte.candidates_stats?.total || 0}</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Candidates Inscrites</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                                        <div className="text-3xl font-black text-green-700 mb-1">{cohorte.candidates_stats?.valides || 0}</div>
                                        <div className="text-xs font-bold text-green-600 uppercase tracking-wider">Validées</div>
                                    </div>
                                </div>

                                {cohorte.statut === 'TERMINEE' && (
                                    <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <h4 className="font-bold text-red-900 text-sm">Cohorte Clôturée</h4>
                                            <p className="text-xs text-red-700 mt-1">
                                                Cette cohorte est terminée. Il n'est plus possible d'ajouter de nouvelles candidates.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'candidates' && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center py-20 animate-slide-up">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Gestion des Candidates</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                La liste des candidates sera bientôt disponible ici. Vous pourrez gérer les inscriptions, validations et abandons.
                            </p>
                            <button
                                onClick={() => navigate('/candidates')}
                                className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Voir toutes les candidates
                            </button>
                        </div>
                    )}

                    {activeTab === 'planning' && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-slide-up">
                            <h3 className="text-lg font-black text-gray-900 mb-6">Calendrier de la Cohorte</h3>
                            
                            <div className="relative">
                                {/* Timeline */}
                                <div className="space-y-8">
                                    {/* Phase Recrutement */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Users size={20} className="text-blue-600" />
                                            </div>
                                            <div className="w-1 flex-1 bg-blue-200 mt-2"></div>
                                        </div>
                                        <div className="flex-1 pb-8">
                                            <h4 className="font-bold text-gray-900 mb-2">Phase de Recrutement</h4>
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Début</div>
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(cohorte.date_debut_recrutement).toLocaleDateString('fr-FR', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Fin</div>
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(cohorte.date_fin_recrutement).toLocaleDateString('fr-FR', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-blue-700">
                                                    Durée: {cohorte.duree_recrutement}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phase Formation */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                                <Briefcase size={20} className="text-purple-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-2">Phase de Formation</h4>
                                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Entrée au centre</div>
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(cohorte.date_entree_centre).toLocaleDateString('fr-FR', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Fin de formation</div>
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(cohorte.date_fin_formation).toLocaleDateString('fr-FR', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-purple-700">
                                                    Durée: {cohorte.duree_formation}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center py-20 animate-slide-up">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Gestion Documentaire</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                La gestion des documents sera bientôt disponible. Vous pourrez uploader et gérer les documents liés à cette cohorte.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModal}
                title="Supprimer la cohorte"
                message="Êtes-vous sûr de vouloir supprimer cette cohorte ?"
                itemName={cohorte.nom}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal(false)}
                isDeleting={isDeleting}
            />
        </div>
    )
}
