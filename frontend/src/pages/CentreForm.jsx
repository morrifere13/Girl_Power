import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { centresAPI, locationsAPI } from '../services/api'
import {
    Building2, MapPin, Phone, User, Briefcase,
    Save, ArrowLeft, Upload, Check, Trash2, Globe, Search, ArrowRight,
    Baby, CheckCircle, ChevronRight, ChevronLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CentreForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    const [loading, setLoading] = useState(false)
    const [activeStep, setActiveStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState([])

    // Location Data
    const [regions, setRegions] = useState([])
    const [villeSuggestions, setVilleSuggestions] = useState([])
    const [showVilleSuggestions, setShowVilleSuggestions] = useState(false)

    const [formData, setFormData] = useState({
        code: '',
        nom: '',
        type_centre: 'Mixte',
        creche: false,
        capacite_accueil: '',
        description: '',

        // Responsable
        responsable_nom: '',
        responsable_prenom: '',
        responsable_fonction: 'Directeur.rice',
        responsable_email_pro: '',
        responsable_email_perso: '',
        responsable_contact: '',
        responsable_contact2: '', // New field

        // Loc & Contact Centre
        region: '',
        ville: '',
        adresse: '',
        latitude: '',
        longitude: '',
        telephone: '',
        telephone_2: '', // New field
        email: '',

        statut: 'ACTIF'
    })

    // Use simple strings or objects? Let's stick to objects to match backend expectation, but handle robustly
    const [selectedMetiers, setSelectedMetiers] = useState([])
    const [photo, setPhoto] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)

    const AVAILABLE_METIERS = [
        'Pâtisserie - Cuisine', 'Coiffure - Esthétique', 'Mécanique Auto',
        'Construction Métallique', 'Agro-pastorale', 'Couture - Mode',
        'Informatique', 'Commerce', 'Autre'
    ]

    const steps = [
        { id: 0, title: 'Identité', icon: Building2, description: 'Type & Capacité' },
        { id: 1, title: 'Responsable', icon: User, description: 'Direction du centre' },
        { id: 2, title: 'Localisation', icon: MapPin, description: 'Adresse & Contacts' },
        { id: 3, title: 'Offre', icon: Briefcase, description: 'Métiers & Photo' }
    ]

    useEffect(() => {
        fetchRegions()
        if (isEdit) {
            fetchCentre()
        } else {
            setFormData(prev => ({
                ...prev,
                code: `CSC-${Math.floor(Math.random() * 10000)}`
            }))
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

    const fetchCentre = async () => {
        try {
            setLoading(true)
            const res = await centresAPI.getById(id)
            const data = res.data

            setFormData({
                ...data,
                creche: Boolean(data.creche),
                adresse: data.adresse || '',
                latitude: data.latitude || '',
                longitude: data.longitude || '',
                description: data.description || '',
                responsable_contact: data.responsable_contact || '',
                responsable_contact2: data.responsable_contact2 || '',
                telephone_2: data.telephone_2 || '',
                responsable_email_pro: data.responsable_email_pro || '',
                responsable_email_perso: data.responsable_email_perso || '',
                responsable_prenom: data.responsable_prenom || '',
                responsable_fonction: data.responsable_fonction || 'Directeur.rice',
                type_centre: data.type_centre || 'Mixte'
            })

            if (data.metiers && Array.isArray(data.metiers)) {
                // Map to simple strings and handling previously double-encoded JSON
                let metierNames = []
                data.metiers.forEach(m => {
                    const val = (typeof m === 'object' ? m.metier_choisi : m)

                    if (val && typeof val === 'string' && val.trim().startsWith('[')) {
                        try {
                            const parsed = JSON.parse(val)
                            if (Array.isArray(parsed)) {
                                metierNames.push(...parsed)
                            } else {
                                metierNames.push(val)
                            }
                        } catch (e) {
                            metierNames.push(val)
                        }
                    } else if (val && typeof val === 'string' && !val.includes('[object') && !val.includes('{')) {
                        metierNames.push(val)
                    }
                })

                // Deduplicate
                metierNames = [...new Set(metierNames)]
                console.log('📥 Loaded Metiers (Cleaned):', metierNames)
                setSelectedMetiers(metierNames)
            } else {
                setSelectedMetiers([])
            }

            if (data.photo_url) {
                setPhotoPreview(`http://localhost:5000${data.photo_url}`)
            }
        } catch (error) {
            toast.error('Erreur chargement centre')
            navigate('/centres')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        let { name, value, type, checked } = e.target
        let newValue = type === 'checkbox' ? checked : value

        // Phone formatting
        if (['telephone', 'telephone_2', 'responsable_contact', 'responsable_contact2'].includes(name)) {
            newValue = value.replace(/\D/g, '').slice(0, 10)
        }

        setFormData(prev => ({ ...prev, [name]: newValue }))
    }

    const handleVilleChange = (e) => {
        const value = e.target.value
        setFormData(prev => ({ ...prev, ville: value }))

        if (value.length > 2 && formData.region) {
            locationsAPI.searchVille(value, formData.region)
                .then(res => {
                    setVilleSuggestions(res.data)
                    setShowVilleSuggestions(true)
                })
                .catch(console.error)
        } else {
            setVilleSuggestions([])
            setShowVilleSuggestions(false)
        }
    }

    const selectVille = (villeData) => {
        setFormData(prev => ({
            ...prev,
            ville: villeData.ville,
        }))
        setVilleSuggestions([])
        setShowVilleSuggestions(false)
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPhoto(file)
            setPhotoPreview(URL.createObjectURL(file))
        }
    }

    const toggleMetier = (metierName) => {
        if (selectedMetiers.includes(metierName)) {
            setSelectedMetiers(selectedMetiers.filter(m => m !== metierName))
        } else {
            setSelectedMetiers([...selectedMetiers, metierName])
        }
    }

    const validateStep = (step) => {
        if (step === 0) {
            if (!formData.nom) { toast.error('Le nom du centre est requis'); return false }
            return true
        }
        if (step === 1) {
            return true
        }
        if (step === 2) {
            if (!formData.region || !formData.ville) { toast.error('La localisation (Région/Ville) est requise'); return false }
            return true
        }
        return true
    }

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setCompletedSteps(prev => [...new Set([...prev, activeStep])])
            setActiveStep(prev => prev + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handlePrev = () => {
        setActiveStep(prev => prev - 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateStep(activeStep)) return

        try {
            setLoading(true)

            const formPayload = new FormData()
            Object.keys(formData).forEach(key => {
                // Exclude special fields that are handled separately or read-only
                if (['metiers', 'photo', 'photo_url', 'created_at', 'updated_at', 'created_by', 'id'].includes(key)) return;

                if (formData[key] !== null && formData[key] !== undefined) {
                    formPayload.append(key, formData[key])
                }
            })

            // Ensure metiers are sent correctly
            const metiersJson = JSON.stringify(selectedMetiers);
            console.log('📤 Sending Metiers:', metiersJson);
            formPayload.append('metiers', metiersJson);

            // Append photo LAST to ensure other fields are processed if server uses streaming parsing improperly (though multer usually OK)
            if (photo) formPayload.append('photo', photo)

            if (isEdit) {
                await centresAPI.update(id, formPayload)
                toast.success('Centre mis à jour')
            } else {
                await centresAPI.create(formPayload)
                toast.success('Centre créé')
            }
            navigate('/centres')

        } catch (error) {
            console.error('Save error:', error)
            toast.error('Erreur lors de l\'enregistrement')
        } finally {
            setLoading(false)
        }
    }

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="label">Nom du Centre *</label>
                                <input type="text" name="nom" required value={formData.nom} onChange={handleChange} className="input-field" placeholder="Ex: Centre Service Civique Bouaké 1" />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label className="label mb-3 block">Type de Centre</label>
                                <div className="space-y-2">
                                    {['Femme', 'Homme', 'Mixte'].map(type => (
                                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="radio"
                                                    name="type_centre"
                                                    value={type}
                                                    checked={formData.type_centre === type}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                />
                                            </div>
                                            <span className="text-gray-700 font-medium group-hover:text-primary-700">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label">Capacité d'accueil</label>
                                    <input type="number" name="capacite_accueil" value={formData.capacite_accueil} onChange={handleChange} className="input-field" placeholder="0" />
                                </div>
                                <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <input type="checkbox" name="creche" checked={formData.creche} onChange={handleChange} className="w-5 h-5 text-primary-600 rounded cursor-pointer" />
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({ ...formData, creche: !formData.creche })}>
                                        <Baby size={20} className="text-blue-600" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-800">Crèche disponible</span>
                                            <span className="text-xs text-blue-600">Pour les enfants des pensionnaires</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="label">Description</label>
                                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="input-field" placeholder="Informations complémentaires..." />
                            </div>
                        </div>
                    </div>
                )
            case 1:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">Informations du Responsable</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">Nom</label>
                                <input type="text" name="responsable_nom" value={formData.responsable_nom} onChange={handleChange} className="input-field" />
                            </div>
                            <div>
                                <label className="label">Prénom</label>
                                <input type="text" name="responsable_prenom" value={formData.responsable_prenom} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="label">Fonction</label>
                                <select name="responsable_fonction" value={formData.responsable_fonction} onChange={handleChange} className="input-field">
                                    <option value="Directeur.rice">Directeur.rice</option>
                                    <option value="Chef.fe de centre">Chef.fe de centre</option>
                                    <option value="Responsable">Responsable</option>
                                    <option value="Intendant.e">Intendant.e</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>

                            <h4 className="md:col-span-2 font-medium text-gray-500 text-sm uppercase tracking-wide mt-4">Coordonnées</h4>

                            <div>
                                <label className="label">Email Professionnel</label>
                                <input type="email" name="responsable_email_pro" value={formData.responsable_email_pro} onChange={handleChange} className="input-field" placeholder="pro@example.com" />
                            </div>
                            <div>
                                <label className="label">Email Personnel</label>
                                <input type="email" name="responsable_email_perso" value={formData.responsable_email_perso} onChange={handleChange} className="input-field" placeholder="perso@gmail.com" />
                            </div>
                            <div>
                                <label className="label">Contact 1 (Mobile)</label>
                                <input type="text" name="responsable_contact" value={formData.responsable_contact} onChange={handleChange} className="input-field" maxLength={10} placeholder="0102030405" />
                            </div>
                            <div>
                                <label className="label">Contact 2</label>
                                <input type="text" name="responsable_contact2" value={formData.responsable_contact2} onChange={handleChange} className="input-field" maxLength={10} placeholder="Autre numéro" />
                            </div>
                        </div>
                    </div>
                )
            case 2:
                return (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Localisation */}
                        <section>
                            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-6 flex items-center gap-2">
                                <MapPin size={18} /> Localisation Géographique
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Région *</label>
                                    <select name="region" required value={formData.region} onChange={handleChange} className="input-field">
                                        <option value="">Sélectionner</option>
                                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <label className="label">Ville *</label>
                                    <input type="text" name="ville" required value={formData.ville} onChange={handleVilleChange}
                                        className="input-field" disabled={!formData.region} autoComplete="off" placeholder={!formData.region ? "Choisir une région..." : ""} />
                                    {showVilleSuggestions && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {villeSuggestions.map((v, i) => (
                                                <div key={i} onClick={() => selectVille(v)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">{v.ville}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label">Adresse / Repère</label>
                                    <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} className="input-field" />
                                </div>
                                <div>
                                    <label className="label">Latitude</label>
                                    <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="input-field" />
                                </div>
                                <div>
                                    <label className="label">Longitude</label>
                                    <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="input-field" />
                                </div>
                            </div>
                        </section>

                        {/* Contacts Centre */}
                        <section>
                            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-6 flex items-center gap-2">
                                <Phone size={18} /> Contacts du Centre
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Contact 1 (Fixe/Mobile)</label>
                                    <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} className="input-field" maxLength={10} />
                                </div>
                                <div>
                                    <label className="label">Contact 2</label>
                                    <input type="text" name="telephone_2" value={formData.telephone_2} onChange={handleChange} className="input-field" maxLength={10} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label">Email du Centre</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" />
                                </div>
                            </div>
                        </section>
                    </div>
                )
            case 3:
                return (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Photo */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center">
                            <h3 className="font-bold text-gray-800 mb-4">Photo du Centre</h3>
                            <div className="relative w-full max-w-lg mx-auto aspect-video bg-gray-50 rounded-xl overflow-hidden mb-4 border-2 border-dashed border-gray-200 hover:border-primary-300 transition-colors group">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <Upload size={32} className="mb-2" />
                                        <span className="text-xs">Ajouter une photo</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>

                        {/* Metiers */}
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Briefcase size={18} /> Métiers disponibles
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {AVAILABLE_METIERS.map((metier) => {
                                    const isSelected = selectedMetiers.includes(metier)
                                    return (
                                        <div key={metier}
                                            onClick={() => toggleMetier(metier)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'}`}>
                                            <span className={`text-sm font-medium ${isSelected ? 'text-primary-800' : 'text-gray-700'}`}>{metier}</span>
                                            {isSelected && <CheckCircle size={18} className="text-primary-600" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-8">
            <div className="max-w-4xl mx-auto px-4">

                {/* Header & Navigation */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Modifier le Centre' : 'Nouveau Centre Civique'}</h1>
                        <p className="text-sm text-gray-500 mt-1">Étape {activeStep + 1} sur {steps.length}</p>
                    </div>
                    <button
                        onClick={() => navigate('/centres')}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                {/* Stepper Progress */}
                <div className="mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full z-0"></div>
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-primary-600 -translate-y-1/2 rounded-full z-0 transition-all duration-300"
                        style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                    ></div>

                    <div className="relative z-10 flex justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon
                            const isActive = activeStep === index
                            const isCompleted = index < activeStep || completedSteps.includes(index)

                            return (
                                <div key={step.id} className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${isActive ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-110' : isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                        {isCompleted ? <Check size={16} /> : <Icon size={18} />}
                                    </div>
                                    <span className={`text-xs font-semibold mt-2 ${isActive ? 'text-primary-700' : 'text-gray-500'}`}>{step.title}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px] flex flex-col justify-between">
                    <div>
                        {renderStepContent()}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
                        <button
                            onClick={handlePrev}
                            disabled={activeStep === 0}
                            className="flex items-center gap-2 px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-0"
                        >
                            <ChevronLeft size={20} /> Précédent
                        </button>

                        {activeStep < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-600/20"
                            >
                                Suivant <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-green-600/20"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                                Terminer
                            </button>
                        )}
                    </div>
                </div>

                {/* Custom Styles */}
                <style>{`
            .label {
                display: block;
                font-size: 0.875rem;
                font-weight: 600;
                color: #374151;
                margin-bottom: 0.375rem;
            }
            .input-field {
                width: 100%;
                padding: 0.625rem 0.875rem;
                border-radius: 0.75rem;
                border: 1px solid #E5E7EB;
                background-color: #F9FAFB;
                transition: all 0.2s;
            }
            .input-field:focus {
                background-color: #FFF;
                border-color: #6366F1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                outline: none;
            }
          `}</style>
            </div>
        </div>
    )
}
