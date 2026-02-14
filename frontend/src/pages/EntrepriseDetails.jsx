import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { entreprisesAPI } from '../services/api'
import {
    Building2, ArrowLeft, Edit, Trash2, MapPin, Phone, Mail,
    User, Calendar, Briefcase, Users, TrendingUp, Award, Plus
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function EntrepriseDetails() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [entreprise, setEntreprise] = useState(null)
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEntreprise()
        fetchStats()
    }, [id])

    const fetchEntreprise = async () => {
        try {
            setLoading(true)
            const res = await entreprisesAPI.getById(id)
            setEntreprise(res.data)
        } catch (error) {
            console.error('Error fetching entreprise:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const res = await entreprisesAPI.getStatistiques(id)
            setStats(res.data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleDelete = async () => {
        if (window.confirm('Voulez-vous vraiment supprimer cette entreprise ?')) {
            try {
                await entreprisesAPI.delete(id)
                toast.success('Entreprise supprimée')
                navigate('/entreprises')
            } catch (error) {
                toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (!entreprise) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Entreprise non trouvée</p>
            </div>
        )
    }

    const stagesActifs = entreprise.stages?.filter(s => s.statut === 'En cours') || []
    const stagesTermines = entreprise.stages?.filter(s => s.statut === 'Terminé') || []

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/entreprises')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour à la liste
                    </button>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="h-10 w-10 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{entreprise.nom}</h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            entreprise.statut === 'Actif' ? 'bg-green-100 text-green-800' :
                                            entreprise.statut === 'Inactif' ? 'bg-gray-100 text-gray-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {entreprise.statut}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                                            {entreprise.secteur_activite}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Code: {entreprise.code}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate(`/entreprises/${id}/edit`)}
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

                        {entreprise.description && (
                            <p className="mt-4 text-gray-600">{entreprise.description}</p>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Stages</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total_stages}</p>
                                </div>
                                <Briefcase className="w-12 h-12 text-blue-600 opacity-20" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">En Cours</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.stages_en_cours}</p>
                                </div>
                                <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Stagiaires</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.nombre_stagiaires_accueillis || 0}</p>
                                </div>
                                <Users className="w-12 h-12 text-purple-600 opacity-20" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Note Moyenne</p>
                                    <p className="text-3xl font-bold text-yellow-600">
                                        {stats.note_moyenne_entreprise ? stats.note_moyenne_entreprise.toFixed(1) : 'N/A'}
                                    </p>
                                </div>
                                <Award className="w-12 h-12 text-yellow-600 opacity-20" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informations Générales */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact et Localisation */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <MapPin className="w-6 h-6 text-purple-600" />
                                Contact et Localisation
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {entreprise.adresse && (
                                    <div>
                                        <p className="text-sm text-gray-600">Adresse</p>
                                        <p className="font-medium">{entreprise.adresse}</p>
                                    </div>
                                )}
                                {entreprise.ville && (
                                    <div>
                                        <p className="text-sm text-gray-600">Ville</p>
                                        <p className="font-medium">{entreprise.ville}</p>
                                    </div>
                                )}
                                {entreprise.region && (
                                    <div>
                                        <p className="text-sm text-gray-600">Région</p>
                                        <p className="font-medium">{entreprise.region}</p>
                                    </div>
                                )}
                                {entreprise.telephone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Téléphone</p>
                                            <p className="font-medium">{entreprise.telephone}</p>
                                        </div>
                                    </div>
                                )}
                                {entreprise.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-medium">{entreprise.email}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Responsable */}
                        {entreprise.responsable_nom && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <User className="w-6 h-6 text-purple-600" />
                                    Responsable
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Nom</p>
                                        <p className="font-medium">{entreprise.responsable_nom}</p>
                                    </div>
                                    {entreprise.responsable_fonction && (
                                        <div>
                                            <p className="text-sm text-gray-600">Fonction</p>
                                            <p className="font-medium">{entreprise.responsable_fonction}</p>
                                        </div>
                                    )}
                                    {entreprise.responsable_contact && (
                                        <div>
                                            <p className="text-sm text-gray-600">Contact</p>
                                            <p className="font-medium">{entreprise.responsable_contact}</p>
                                        </div>
                                    )}
                                    {entreprise.responsable_email && (
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-medium">{entreprise.responsable_email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Stages en Cours */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-purple-600" />
                                    Stages en Cours
                                </h2>
                                <button
                                    onClick={() => navigate('/stages/new')}
                                    className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Affecter Stagiaire
                                </button>
                            </div>

                            {stagesActifs.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Aucun stage en cours</p>
                            ) : (
                                <div className="space-y-3">
                                    {stagesActifs.map(stage => (
                                        <Link
                                            key={stage.id}
                                            to={`/stages/${stage.id}`}
                                            className="block p-4 border rounded-lg hover:bg-gray-50 transition"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {stage.candidate_nom} {stage.candidate_prenom}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{stage.metier_stage}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(stage.date_debut).toLocaleDateString('fr-FR')} -
                                                        {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                    {stage.statut}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Partenariat */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                Partenariat
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Type</p>
                                    <p className="font-medium">{entreprise.type_partenariat || 'N/A'}</p>
                                </div>
                                {entreprise.date_convention && (
                                    <div>
                                        <p className="text-sm text-gray-600">Date Convention</p>
                                        <p className="font-medium">
                                            {new Date(entreprise.date_convention).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                )}
                                {entreprise.duree_convention_mois && (
                                    <div>
                                        <p className="text-sm text-gray-600">Durée</p>
                                        <p className="font-medium">{entreprise.duree_convention_mois} mois</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Capacité */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Capacité</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Stagiaires Max</p>
                                    <p className="font-medium text-2xl text-purple-600">
                                        {entreprise.capacite_stagiaires_max || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Métiers Proposés</p>
                                    {entreprise.metiers_proposes && entreprise.metiers_proposes.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {entreprise.metiers_proposes.map((metier, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                                >
                                                    {metier}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Aucun métier spécifié</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
