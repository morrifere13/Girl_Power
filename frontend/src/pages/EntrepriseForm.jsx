import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { entreprisesAPI, locationsAPI } from '../services/api'
import {
    Building2, MapPin, Phone, User, Briefcase, Save, ArrowLeft, Mail, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function EntrepriseForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    const [loading, setLoading] = useState(false)
    const [regions, setRegions] = useState([])

    const [formData, setFormData] = useState({
        nom: '',
        secteur_activite: '',
        description: '',
        adresse: '',
        region: '',
        ville: '',
        telephone: '',
        telephone_2: '',
        email: '',
        responsable_nom: '',
        responsable_fonction: '',
        responsable_contact: '',
        responsable_email: '',
        capacite_stagiaires_max: 5,
        type_partenariat: 'Partenariat ponctuel',
        date_convention: '',
        duree_convention_mois: '',
        conditions_partenariat: '',
        statut: 'Actif'
    })

    const [selectedMetiers, setSelectedMetiers] = useState([])

    const AVAILABLE_METIERS = [
        'Pâtisserie - Cuisine', 'Coiffure - Esthétique', 'Mécanique Auto',
        'Construction Métallique', 'Agro-pastorale', 'Couture - Mode',
        'Informatique', 'Commerce', 'Restauration', 'Hôtellerie', 'Autre'
    ]

    const SECTEURS = [
        'Agriculture', 'Agroalimentaire', 'Commerce', 'Construction',
        'Éducation', 'Hôtellerie-Restauration', 'Industrie', 'Informatique',
        'Santé', 'Services', 'Textile', 'Transport', 'Autre'
    ]

    useEffect(() => {
        fetchRegions()
        if (isEdit) {
            fetchEntreprise()
        }
    }, [id])

    const fetchRegions = async () => {
        try {
            const res = await locationsAPI.getRegions()
            setRegions(res.data)
        } catch (error) {
            console.error('Error fetching regions:', error)
        }
    }

    const fetchEntreprise = async () => {
        try {
            setLoading(true)
            const res = await entreprisesAPI.getById(id)
            const data = res.data
            setFormData({
                ...data,
                date_convention: data.date_convention ? data.date_convention.split('T')[0] : '',
                duree_convention_mois: data.duree_convention_mois || '',
                conditions_partenariat: data.conditions_partenariat || '',
                description: data.description || ''
            })

            if (data.metiers_proposes) {
                const metiers = Array.isArray(data.metiers_proposes)
                    ? data.metiers_proposes
                    : JSON.parse(data.metiers_proposes || '[]')
                setSelectedMetiers(metiers)
            }
        } catch (error) {
            console.error('Error fetching entreprise:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const toggleMetier = (metier) => {
        setSelectedMetiers(prev =>
            prev.includes(metier)
                ? prev.filter(m => m !== metier)
                : [...prev, metier]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.nom || !formData.secteur_activite) {
            toast.error('Nom et secteur sont requis')
            return
        }

        try {
            setLoading(true)
            const dataToSend = {
                ...formData,
                metiers_proposes: selectedMetiers
            }

            if (isEdit) {
                await entreprisesAPI.update(id, dataToSend)
                toast.success('Entreprise mise à jour')
            } else {
                const response = await entreprisesAPI.create(dataToSend)
                toast.success('Entreprise créée')
                navigate(`/entreprises/${response.data.entreprise.id}`)
                return
            }

            navigate(`/entreprises/${id}`)
        } catch (error) {
            console.error('Error saving entreprise:', error)
            toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/entreprises')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour à la liste
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-purple-600" />
                        {isEdit ? 'Modifier l\'Entreprise' : 'Nouvelle Entreprise'}
                    </h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informations Générales */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-purple-600" />
                            Informations Générales
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom de l'Entreprise *
                                </label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Secteur d'Activité *
                                </label>
                                <select
                                    name="secteur_activite"
                                    value={formData.secteur_activite}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Sélectionner</option>
                                    {SECTEURS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Statut
                                </label>
                                <select
                                    name="statut"
                                    value={formData.statut}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Actif">Actif</option>
                                    <option value="Inactif">Inactif</option>
                                    <option value="Suspendu">Suspendu</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Localisation et Contact */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-purple-600" />
                            Localisation et Contact
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Région
                                </label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Sélectionner</option>
                                    {regions.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ville
                                </label>
                                <input
                                    type="text"
                                    name="ville"
                                    value={formData.ville}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone 2
                                </label>
                                <input
                                    type="tel"
                                    name="telephone_2"
                                    value={formData.telephone_2}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Responsable */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <User className="w-6 h-6 text-purple-600" />
                            Responsable
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom Complet
                                </label>
                                <input
                                    type="text"
                                    name="responsable_nom"
                                    value={formData.responsable_nom}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fonction
                                </label>
                                <input
                                    type="text"
                                    name="responsable_fonction"
                                    value={formData.responsable_fonction}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact
                                </label>
                                <input
                                    type="tel"
                                    name="responsable_contact"
                                    value={formData.responsable_contact}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="responsable_email"
                                    value={formData.responsable_email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Capacité et Métiers */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Briefcase className="w-6 h-6 text-purple-600" />
                            Capacité et Métiers Proposés
                        </h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Capacité Maximum de Stagiaires
                            </label>
                            <input
                                type="number"
                                name="capacite_stagiaires_max"
                                value={formData.capacite_stagiaires_max}
                                onChange={handleChange}
                                min="1"
                                className="w-full md:w-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Métiers Proposés pour Stages
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {AVAILABLE_METIERS.map(metier => (
                                    <button
                                        key={metier}
                                        type="button"
                                        onClick={() => toggleMetier(metier)}
                                        className={`px-4 py-2 rounded-lg border-2 transition ${
                                            selectedMetiers.includes(metier)
                                                ? 'bg-purple-100 border-purple-500 text-purple-700'
                                                : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300'
                                        }`}
                                    >
                                        {metier}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Partenariat */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-purple-600" />
                            Partenariat
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de Partenariat
                                </label>
                                <select
                                    name="type_partenariat"
                                    value={formData.type_partenariat}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Convention">Convention</option>
                                    <option value="Accord cadre">Accord cadre</option>
                                    <option value="Partenariat ponctuel">Partenariat ponctuel</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Convention
                                </label>
                                <input
                                    type="date"
                                    name="date_convention"
                                    value={formData.date_convention}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Durée (mois)
                                </label>
                                <input
                                    type="number"
                                    name="duree_convention_mois"
                                    value={formData.duree_convention_mois}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Conditions du Partenariat
                                </label>
                                <textarea
                                    name="conditions_partenariat"
                                    value={formData.conditions_partenariat}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/entreprises')}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Enregistrement...' : isEdit ? 'Mettre à Jour' : 'Créer l\'Entreprise'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
