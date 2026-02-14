import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { stagesAPI, candidatesAPI, entreprisesAPI, cohortesAPI, projectsAPI } from '../services/api'
import {
    Briefcase, Save, ArrowLeft, Users, Building2, Calendar, User, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function StageForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    const [loading, setLoading] = useState(false)
    const [candidates, setCandidates] = useState([])
    const [entreprises, setEntreprises] = useState([])
    const [cohortes, setCohortes] = useState([])
    const [projects, setProjects] = useState([])

    const [formData, setFormData] = useState({
        candidate_id: '',
        entreprise_id: '',
        cohorte_id: '',
        projet_id: '',
        date_debut: '',
        date_fin: '',
        type_stage: 'Stage post-formation',
        metier_stage: '',
        tuteur_nom: '',
        tuteur_fonction: '',
        tuteur_contact: '',
        tuteur_email: '',
        indemnite_mensuelle: '',
        frais_transport: '',
        autres_avantages: '',
        observations: ''
    })

    useEffect(() => {
        fetchData()
        if (isEdit) {
            fetchStage()
        }
    }, [id])

    const fetchData = async () => {
        try {
            const [candRes, entRes, cohRes, projRes] = await Promise.all([
                candidatesAPI.getAll({ statut: 'VALIDEE' }),
                entreprisesAPI.getAll({ statut: 'Actif' }),
                cohortesAPI.getAll(),
                projectsAPI.getAll()
            ])

            // S'assurer que les données sont des tableaux
            setCandidates(Array.isArray(candRes.data) ? candRes.data : candRes.data?.candidates || [])
            setEntreprises(Array.isArray(entRes.data) ? entRes.data : entRes.data?.entreprises || [])
            setCohortes(Array.isArray(cohRes.data) ? cohRes.data : cohRes.data?.cohortes || [])
            setProjects(Array.isArray(projRes.data) ? projRes.data : projRes.data?.projects || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Erreur lors du chargement des données')
        }
    }

    const fetchStage = async () => {
        try {
            setLoading(true)
            const res = await stagesAPI.getById(id)
            const data = res.data
            setFormData({
                candidate_id: data.candidate_id,
                entreprise_id: data.entreprise_id,
                cohorte_id: data.cohorte_id || '',
                projet_id: data.projet_id || '',
                date_debut: data.date_debut ? data.date_debut.split('T')[0] : '',
                date_fin: data.date_fin ? data.date_fin.split('T')[0] : '',
                type_stage: data.type_stage,
                metier_stage: data.metier_stage,
                tuteur_nom: data.tuteur_nom || '',
                tuteur_fonction: data.tuteur_fonction || '',
                tuteur_contact: data.tuteur_contact || '',
                tuteur_email: data.tuteur_email || '',
                indemnite_mensuelle: data.indemnite_mensuelle || '',
                frais_transport: data.frais_transport || '',
                autres_avantages: data.autres_avantages || '',
                observations: data.observations || ''
            })
        } catch (error) {
            console.error('Error fetching stage:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const validateDates = () => {
        if (!formData.date_debut || !formData.date_fin) {
            toast.error('Les dates de début et fin sont requises')
            return false
        }

        const debut = new Date(formData.date_debut)
        const fin = new Date(formData.date_fin)

        if (fin <= debut) {
            toast.error('La date de fin doit être après la date de début')
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.candidate_id || !formData.entreprise_id) {
            toast.error('Candidate et entreprise sont requis')
            return
        }

        if (!formData.metier_stage || !formData.type_stage) {
            toast.error('Type de stage et métier sont requis')
            return
        }

        if (!validateDates()) {
            return
        }

        try {
            setLoading(true)

            // Convertir les valeurs vides en null pour les champs optionnels
            const dataToSend = {
                ...formData,
                cohorte_id: formData.cohorte_id || null,
                projet_id: formData.projet_id || null,
                indemnite_mensuelle: formData.indemnite_mensuelle || null,
                frais_transport: formData.frais_transport || null
            }

            if (isEdit) {
                await stagesAPI.update(id, dataToSend)
                toast.success('Stage mis à jour')
            } else {
                const response = await stagesAPI.create(dataToSend)
                toast.success('Stage créé avec succès')
                navigate(`/stages/${response.data.stage.id}`)
                return
            }

            navigate(`/stages/${id}`)
        } catch (error) {
            console.error('Error saving stage:', error)
            toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
        } finally {
            setLoading(false)
        }
    }

    const selectedCandidate = candidates.find(c => c.id === parseInt(formData.candidate_id))
    const selectedEntreprise = entreprises.find(e => e.id === parseInt(formData.entreprise_id))

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/stages')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour à la liste
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                        {isEdit ? 'Modifier le Stage' : 'Nouveau Stage'}
                    </h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Affectation */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            Affectation
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Candidate *
                                </label>
                                <select
                                    name="candidate_id"
                                    value={formData.candidate_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Sélectionner une candidate</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.prenom} {c.nom} - {c.metier_choisi || 'N/A'}
                                            {c.projet_nom ? ` | Projet: ${c.projet_nom}` : ''}
                                            {c.cohorte_nom ? ` | Cohorte: ${c.cohorte_nom}` : ''}
                                            {c.centre_nom ? ` | Centre: ${c.centre_nom}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {selectedCandidate && (
                                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div>
                                                <span className="font-semibold text-gray-700">Contact:</span>
                                                <p className="text-gray-600">{selectedCandidate.telephone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700">Projet:</span>
                                                <p className="text-gray-600">{selectedCandidate.projet_nom || 'Aucun'}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700">Cohorte:</span>
                                                <p className="text-gray-600">{selectedCandidate.cohorte_nom || 'Aucune'}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700">Centre:</span>
                                                <p className="text-gray-600">{selectedCandidate.centre_nom || 'Aucun'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Entreprise *
                                </label>
                                <select
                                    name="entreprise_id"
                                    value={formData.entreprise_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Sélectionner une entreprise</option>
                                    {entreprises.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.nom} - {e.secteur_activite || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                                {selectedEntreprise && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Capacité: {selectedEntreprise.capacite_stagiaires_max || 'N/A'} |
                                        Contact: {selectedEntreprise.telephone || 'N/A'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Période et Type */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-blue-600" />
                            Période et Type
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Début *
                                </label>
                                <input
                                    type="date"
                                    name="date_debut"
                                    value={formData.date_debut}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Fin *
                                </label>
                                <input
                                    type="date"
                                    name="date_fin"
                                    value={formData.date_fin}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de Stage *
                                </label>
                                <select
                                    name="type_stage"
                                    value={formData.type_stage}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Stage pendant formation">Stage pendant formation</option>
                                    <option value="Stage post-formation">Stage post-formation</option>
                                    <option value="Stage insertion">Stage insertion professionnelle</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Métier/Poste *
                                </label>
                                <input
                                    type="text"
                                    name="metier_stage"
                                    value={formData.metier_stage}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Pâtissière, Coiffeuse..."
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cohorte (optionnel)
                                </label>
                                <select
                                    name="cohorte_id"
                                    value={formData.cohorte_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Aucune cohorte</option>
                                    {cohortes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.nom} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Projet (optionnel)
                                </label>
                                <select
                                    name="projet_id"
                                    value={formData.projet_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Aucun projet</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Encadrement */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <User className="w-6 h-6 text-blue-600" />
                            Tuteur Entreprise
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom du Tuteur
                                </label>
                                <input
                                    type="text"
                                    name="tuteur_nom"
                                    value={formData.tuteur_nom}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fonction
                                </label>
                                <input
                                    type="text"
                                    name="tuteur_fonction"
                                    value={formData.tuteur_fonction}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact
                                </label>
                                <input
                                    type="tel"
                                    name="tuteur_contact"
                                    value={formData.tuteur_contact}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="tuteur_email"
                                    value={formData.tuteur_email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Conditions Financières */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                            Conditions Financières (optionnel)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Indemnité Mensuelle (FCFA)
                                </label>
                                <input
                                    type="number"
                                    name="indemnite_mensuelle"
                                    value={formData.indemnite_mensuelle}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Frais de Transport (FCFA)
                                </label>
                                <input
                                    type="number"
                                    name="frais_transport"
                                    value={formData.frais_transport}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Autres Avantages
                                </label>
                                <textarea
                                    name="autres_avantages"
                                    value={formData.autres_avantages}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Repas fourni, transport assuré..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Observations
                                </label>
                                <textarea
                                    name="observations"
                                    value={formData.observations}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/stages')}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Enregistrement...' : isEdit ? 'Mettre à Jour' : 'Créer le Stage'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
