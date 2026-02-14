import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { stagesAPI } from '../services/api'
import {
    Briefcase, ArrowLeft, Edit, Trash2, Users, Building2, Calendar,
    User, Phone, Mail, DollarSign, CheckCircle, Clock, XCircle, Plus
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function StageDetails() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [stage, setStage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showEvalModal, setShowEvalModal] = useState(false)
    const [evalForm, setEvalForm] = useState({
        date_evaluation: new Date().toISOString().split('T')[0],
        periode: '',
        evaluateur_nom: '',
        evaluateur_type: 'Tuteur entreprise',
        note_competences_techniques: '',
        note_comportement_professionnel: '',
        note_assiduite: '',
        note_autonomie: '',
        note_integration: '',
        note_globale: '',
        points_forts: '',
        points_amelioration: '',
        commentaire_general: ''
    })

    useEffect(() => {
        fetchStage()
    }, [id])

    const fetchStage = async () => {
        try {
            setLoading(true)
            const res = await stagesAPI.getById(id)
            setStage(res.data)
        } catch (error) {
            console.error('Error fetching stage:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (window.confirm('Voulez-vous vraiment supprimer ce stage ?')) {
            try {
                await stagesAPI.delete(id)
                toast.success('Stage supprimé')
                navigate('/stages')
            } catch (error) {
                toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
            }
        }
    }

    const handleChangeStatut = async (newStatut) => {
        try {
            await stagesAPI.updateStatut(id, { statut: newStatut })
            toast.success('Statut mis à jour')
            fetchStage()
        } catch (error) {
            toast.error('Erreur lors du changement de statut')
        }
    }

    const handleAddEvaluation = async (e) => {
        e.preventDefault()
        try {
            await stagesAPI.addEvaluation(id, evalForm)
            toast.success('Évaluation ajoutée')
            setShowEvalModal(false)
            fetchStage()
        } catch (error) {
            toast.error('Erreur lors de l\'ajout de l\'évaluation')
        }
    }

    const getStatutIcon = (statut) => {
        switch (statut) {
            case 'En cours': return <CheckCircle className="w-5 h-5" />
            case 'Planifié': return <Clock className="w-5 h-5" />
            case 'Terminé': return <CheckCircle className="w-5 h-5" />
            default: return <XCircle className="w-5 h-5" />
        }
    }

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'En cours': return 'bg-green-100 text-green-800'
            case 'Planifié': return 'bg-blue-100 text-blue-800'
            case 'Terminé': return 'bg-gray-100 text-gray-800'
            default: return 'bg-red-100 text-red-800'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!stage) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Stage non trouvé</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/stages')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour à la liste
                    </button>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <Briefcase className="w-8 h-8 text-blue-600" />
                                    Stage {stage.code}
                                </h1>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatutColor(stage.statut)}`}>
                                        {getStatutIcon(stage.statut)}
                                        {stage.statut}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                                        {stage.type_stage}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {stage.statut === 'Planifié' && (
                                    <button
                                        onClick={() => handleChangeStatut('En cours')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Démarrer
                                    </button>
                                )}
                                {stage.statut === 'En cours' && (
                                    <button
                                        onClick={() => handleChangeStatut('Terminé')}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                    >
                                        Terminer
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate(`/stages/${id}/edit`)}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Modifier
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer
                                </button>
                            </div>
                        </div>

                        {/* Période */}
                        <div className="mt-6 flex items-center gap-4 text-gray-600">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                <span>
                                    Du {new Date(stage.date_debut).toLocaleDateString('fr-FR')} au {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                            <span className="text-blue-600 font-semibold">
                                Durée: {stage.duree_mois} mois
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne Principale */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Candidate et Entreprise */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Acteurs</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Candidate */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-semibold">Candidate</h3>
                                    </div>
                                    <Link
                                        to={`/candidates/${stage.candidate_id}`}
                                        className="block p-4 border rounded-lg hover:bg-gray-50 transition"
                                    >
                                        <p className="font-medium text-lg">{stage.candidate_prenom} {stage.candidate_nom}</p>
                                        {stage.candidate_telephone && (
                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                <Phone className="w-3 h-3" />
                                                {stage.candidate_telephone}
                                            </p>
                                        )}
                                        {stage.candidate_email && (
                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {stage.candidate_email}
                                            </p>
                                        )}
                                    </Link>
                                </div>

                                {/* Entreprise */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-semibold">Entreprise</h3>
                                    </div>
                                    <Link
                                        to={`/entreprises/${stage.entreprise_id}`}
                                        className="block p-4 border rounded-lg hover:bg-gray-50 transition"
                                    >
                                        <p className="font-medium text-lg">{stage.entreprise_nom}</p>
                                        <p className="text-sm text-gray-600">{stage.secteur_activite}</p>
                                        {stage.entreprise_telephone && (
                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                <Phone className="w-3 h-3" />
                                                {stage.entreprise_telephone}
                                            </p>
                                        )}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Détails du Stage */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Détails du Stage</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Métier/Poste</p>
                                    <p className="font-medium text-lg">{stage.metier_stage}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Type de Stage</p>
                                    <p className="font-medium">{stage.type_stage}</p>
                                </div>
                                {stage.indemnite_mensuelle && (
                                    <div>
                                        <p className="text-sm text-gray-600">Indemnité Mensuelle</p>
                                        <p className="font-medium">{stage.indemnite_mensuelle} FCFA</p>
                                    </div>
                                )}
                                {stage.frais_transport && (
                                    <div>
                                        <p className="text-sm text-gray-600">Frais de Transport</p>
                                        <p className="font-medium">{stage.frais_transport} FCFA</p>
                                    </div>
                                )}
                            </div>
                            {stage.observations && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">Observations</p>
                                    <p className="mt-1 text-gray-700">{stage.observations}</p>
                                </div>
                            )}
                        </div>

                        {/* Évaluations */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Évaluations</h2>
                                <button
                                    onClick={() => setShowEvalModal(true)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                </button>
                            </div>

                            {stage.evaluations && stage.evaluations.length > 0 ? (
                                <div className="space-y-4">
                                    {stage.evaluations.map((evaluation, idx) => (
                                        <div key={idx} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold">{evaluation.periode || 'Évaluation'}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')} - {evaluation.evaluateur_type}
                                                    </p>
                                                </div>
                                                {evaluation.note_globale && (
                                                    <span className="text-2xl font-bold text-blue-600">
                                                        {evaluation.note_globale}/5
                                                    </span>
                                                )}
                                            </div>
                                            {evaluation.commentaire_general && (
                                                <p className="text-sm text-gray-700 mt-2">{evaluation.commentaire_general}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Aucune évaluation</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Tuteur */}
                        {stage.tuteur_nom && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Tuteur Entreprise
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Nom</p>
                                        <p className="font-medium">{stage.tuteur_nom}</p>
                                    </div>
                                    {stage.tuteur_fonction && (
                                        <div>
                                            <p className="text-sm text-gray-600">Fonction</p>
                                            <p className="font-medium">{stage.tuteur_fonction}</p>
                                        </div>
                                    )}
                                    {stage.tuteur_contact && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <p className="text-sm">{stage.tuteur_contact}</p>
                                        </div>
                                    )}
                                    {stage.tuteur_email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <p className="text-sm">{stage.tuteur_email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Statistiques */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Statistiques</h2>
                            <div className="space-y-3">
                                {stage.taux_presence && (
                                    <div>
                                        <p className="text-sm text-gray-600">Taux de Présence</p>
                                        <p className="text-2xl font-bold text-green-600">{stage.taux_presence}%</p>
                                    </div>
                                )}
                                {stage.nombre_jours_absence !== undefined && (
                                    <div>
                                        <p className="text-sm text-gray-600">Jours d'Absence</p>
                                        <p className="text-2xl font-bold text-red-600">{stage.nombre_jours_absence}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">Nombre d'Évaluations</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {stage.evaluations ? stage.evaluations.length : 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Évaluation */}
            {showEvalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold mb-4">Ajouter une Évaluation</h2>
                        <form onSubmit={handleAddEvaluation} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={evalForm.date_evaluation}
                                        onChange={(e) => setEvalForm({...evalForm, date_evaluation: e.target.value})}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Période</label>
                                    <input
                                        type="text"
                                        value={evalForm.periode}
                                        onChange={(e) => setEvalForm({...evalForm, periode: e.target.value})}
                                        placeholder="Ex: Mi-parcours"
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Évaluateur</label>
                                    <input
                                        type="text"
                                        value={evalForm.evaluateur_nom}
                                        onChange={(e) => setEvalForm({...evalForm, evaluateur_nom: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type</label>
                                    <select
                                        value={evalForm.evaluateur_type}
                                        onChange={(e) => setEvalForm({...evalForm, evaluateur_type: e.target.value})}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="Tuteur entreprise">Tuteur entreprise</option>
                                        <option value="Formateur centre">Formateur centre</option>
                                        <option value="Coordinateur projet">Coordinateur projet</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Note Globale /5</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={evalForm.note_globale}
                                    onChange={(e) => setEvalForm({...evalForm, note_globale: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Commentaire</label>
                                <textarea
                                    value={evalForm.commentaire_general}
                                    onChange={(e) => setEvalForm({...evalForm, commentaire_general: e.target.value})}
                                    rows="4"
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEvalModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
