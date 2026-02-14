import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsAPI, centresAPI, locationsAPI } from '../services/api'
import {
    Save, X, Calendar, FileText,
    CheckSquare, Plus, Upload, Trash2, MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProjectForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditMode = !!id

    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('general')
    const [centres, setCentres] = useState([])

    // Custom Inputs
    const [newPartner, setNewPartner] = useState('')
    const [newBailleur, setNewBailleur] = useState('')

    // Location Data States
    const [regions, setRegions] = useState([])
    const [activeDepartements, setActiveDepartements] = useState([])
    const [activeSousPrefectures, setActiveSousPrefectures] = useState([])
    const [activeLocalites, setActiveLocalites] = useState([])

    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        date_debut: '',
        date_fin: '',
        statut: 'PLANIFIE',

        // New V2 fields
        genre_cible: 'MIXTE',
        pays_cible: ['Côte d\'Ivoire'],

        // KPIs
        cible_quantitative: 500,
        objectif_reclassement: 70,
        taux_abandon_max: 5,

        centre_ids: [],

        bailleurs: [],
        partenaires: [],
        avantages: [],
        criteres_admission: {
            age_min: 16,
            age_max: 35,
            sexe: ['F'],
            niveau_scolaire: [], // Restored
            diplome: [], // Restored
            nationalite: [],
            documents_requis: [],
            enfants_autorises: false
        },
        zones_intervention: {
            regions: [], // Can contain "TOUTES"
            departements: [], // Can contain "TOUTES"
            sous_prefectures: [], // ...
            localites: []
        }
    })

    const [files, setFiles] = useState({
        convention: null,
        tdr: null,
        rapports: []
    })

    const [durationDetail, setDurationDetail] = useState(null)

    // Options
    const [availableBailleurs, setAvailableBailleurs] = useState(['Union Européenne', 'Banque Mondiale', 'Unicef', 'État de Côte d\'Ivoire', 'ONG Internationale'])
    const [availablePartenaires, setAvailablePartenaires] = useState(['Mairie', 'Ministère de la Jeunesse', 'Associations Locales', 'Entreprises Privées'])
    const availableAvantages = ['Formation Gratuite', 'Permis de Conduire', 'AGR', 'Prime de Transport', 'Kit d\'Installation', 'Assurance Maladie', 'Garde d\'Enfants', 'Alphabétisation']
    const availableNiveaux = ['Aucun', 'Primaire', 'Collège', 'Lycée', 'Universitaire']
    const availableDiplomes = ['Aucun', 'CEPE', 'BEPC', 'BAC', 'BTS', 'LICENCE', 'MASTER']
    const availableNationalites = ['Ivoirienne', 'Ressortissant UEMOA', 'Autre']
    const UEMOA_COUNTRIES = ['Côte d\'Ivoire', 'Bénin', 'Burkina Faso', 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo', 'Guinée']

    useEffect(() => {
        fetchInitialData()
        if (isEditMode) {
            fetchProject()
        }
    }, [id])

    // --- Location Cascade Effects ---

    // 1. Fetch Department Options when Selected Regions change
    useEffect(() => {
        const fetchDepts = async () => {
            const selectedRegions = formData.zones_intervention.regions;
            if (selectedRegions.includes('TOUTES') || selectedRegions.length === 0) {
                setActiveDepartements([]);
                return;
            }
            let allDepts = [];
            for (const reg of selectedRegions) {
                try {
                    const res = await locationsAPI.getDepartements(reg);
                    allDepts = [...allDepts, ...res.data];
                } catch (e) { console.error('Error fetching depts', e) }
            }
            setActiveDepartements(allDepts);
        };
        fetchDepts();
    }, [formData.zones_intervention.regions]);

    // 2. Fetch Sous-Prefectures when Selected Depts change
    useEffect(() => {
        const fetchSPs = async () => {
            const selectedDepts = formData.zones_intervention.departements;
            if (selectedDepts.includes('TOUS') || selectedDepts.length === 0) {
                setActiveSousPrefectures([]);
                return;
            }
            let allSPs = [];
            for (const dept of selectedDepts) {
                try {
                    const res = await locationsAPI.getSousPrefectures(dept);
                    allSPs = [...allSPs, ...res.data];
                } catch (e) { console.error('Error fetching SPs', e) }
            }
            setActiveSousPrefectures(allSPs);
        };
        fetchSPs();
    }, [formData.zones_intervention.departements]);

    // 3. Fetch Localities when Selected SPs change
    useEffect(() => {
        const fetchLocs = async () => {
            const selectedSPs = formData.zones_intervention.sous_prefectures;
            if (selectedSPs.includes('TOUTES') || selectedSPs.length === 0) {
                setActiveLocalites([]);
                return;
            }
            let allLocs = [];
            for (const sp of selectedSPs) {
                try {
                    const res = await locationsAPI.getLocalites(sp);
                    allLocs = [...allLocs, ...res.data];
                } catch (e) { console.error('Error fetching Localities', e) }
            }
            setActiveLocalites(allLocs);
        };
        fetchLocs();
    }, [formData.zones_intervention.sous_prefectures]);


    useEffect(() => {
        if (formData.date_debut && formData.date_fin) {
            const start = new Date(formData.date_debut)
            const end = new Date(formData.date_fin)
            let years = end.getFullYear() - start.getFullYear()
            let months = end.getMonth() - start.getMonth()
            let days = end.getDate() - start.getDate()
            if (days < 0) { months--; days += new Date(end.getFullYear(), end.getMonth(), 0).getDate() }
            if (months < 0) { years--; months += 12 }
            setDurationDetail(`${years > 0 ? years + ' an(s) ' : ''}${months} mois ${days} jours`)
        }
    }, [formData.date_debut, formData.date_fin])

    const fetchInitialData = async () => {
        try {
            const [centresRes, regionsRes] = await Promise.all([
                centresAPI.getAll(),
                locationsAPI.getRegions()
            ])
            setCentres(centresRes.data)
            setRegions(regionsRes.data)
        } catch (error) {
            console.error('Error loading initial data:', error)
        }
    }

    const fetchProject = async () => {
        try {
            setLoading(true)
            const response = await projectsAPI.getById(id)
            const data = response.data

            setFormData({
                ...data,
                date_debut: data.date_debut?.split('T')[0],
                date_fin: data.date_fin?.split('T')[0],
                centre_ids: data.centres ? data.centres.map(c => c.id) : [],
                // Ensure arrays are initialized if null
                pays_cible: data.pays_cible || ['Côte d\'Ivoire'],
                bailleurs: data.bailleurs || [],
                partenaires: data.partenaires || [],
                zones_intervention: data.zones_intervention || { regions: [], departements: [], sous_prefectures: [], localites: [] }
            })

            // Update available lists with custom partners/funders from loaded project
            if (data.bailleurs && Array.isArray(data.bailleurs)) {
                const customBailleurs = data.bailleurs.filter(b => !availableBailleurs.includes(b))
                if (customBailleurs.length > 0) {
                    setAvailableBailleurs(prev => [...prev, ...customBailleurs])
                }
            }
            if (data.partenaires && Array.isArray(data.partenaires)) {
                const customPartenaires = data.partenaires.filter(p => !availablePartenaires.includes(p))
                if (customPartenaires.length > 0) {
                    setAvailablePartenaires(prev => [...prev, ...customPartenaires])
                }
            }
        } catch (error) {
            toast.error('Erreur chargement projet')
            navigate('/projects')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const payload = new FormData()
            payload.append('nom', formData.nom.toUpperCase())
            payload.append('description', formData.description)
            payload.append('date_debut', formData.date_debut)
            payload.append('date_fin', formData.date_fin)
            payload.append('statut', formData.statut)

            payload.append('cible_quantitative', formData.cible_quantitative)
            payload.append('objectif_reclassement', formData.objectif_reclassement)
            payload.append('taux_abandon_max', formData.taux_abandon_max)

            payload.append('genre_cible', formData.genre_cible)
            payload.append('pays_cible', JSON.stringify(formData.pays_cible))

            payload.append('centre_ids', JSON.stringify(formData.centre_ids))
            payload.append('bailleurs', JSON.stringify(formData.bailleurs))
            payload.append('partenaires', JSON.stringify(formData.partenaires))
            payload.append('avantages', JSON.stringify(formData.avantages))
            payload.append('criteres_admission', JSON.stringify(formData.criteres_admission))
            payload.append('zones_intervention', JSON.stringify(formData.zones_intervention))

            if (files.convention) payload.append('convention', files.convention)
            if (files.tdr) payload.append('tdr', files.tdr)
            files.rapports.forEach(f => payload.append('rapports', f))

            if (isEditMode) {
                await projectsAPI.update(id, payload)
                toast.success('Projet mis à jour')
            } else {
                await projectsAPI.create(payload)
                toast.success('Projet créé')
            }
            navigate('/projects')
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Erreur enregistrement')
        } finally {
            setLoading(false)
        }
    }

    const toggleArrayItem = (field, value) => {
        setFormData(prev => {
            const current = prev[field] || []
            const updated = current.includes(value) ? current.filter(item => item !== value) : [...current, value]
            return { ...prev, [field]: updated }
        })
    }

    const toggleCriteriaItem = (subfield, value) => {
        setFormData(prev => {
            const info = prev.criteres_admission[subfield] || []
            const updated = info.includes(value) ? info.filter(i => i !== value) : [...info, value]
            return { ...prev, criteres_admission: { ...prev.criteres_admission, [subfield]: updated } }
        })
    }

    // --- Generic Multi-Select Toggle for Locations ---
    // Special logic: 'TOUTES'/'TOUS' excludes others and vice versa (simplified)
    // Actually simplest is: If you click ALL, it clears others. If you click specific, it removes ALL.
    const toggleLocation = (level, value) => {
        setFormData(prev => {
            const zone = { ...prev.zones_intervention };
            let current = zone[level] || [];

            if (value === 'TOUTES' || value === 'TOUS') {
                // If selecting ALL, clear everything else
                zone[level] = [value];
            } else {
                // If selecting specific
                // First remove ALL token if present
                current = current.filter(x => x !== 'TOUTES' && x !== 'TOUS');

                if (current.includes(value)) {
                    current = current.filter(x => x !== value);
                } else {
                    current = [...current, value];
                }
                zone[level] = current;
            }

            // Clear children levels when parent changes?
            // For simplicity, yes, to avoid invalid state.
            if (level === 'regions') { zone.departements = []; zone.sous_prefectures = []; zone.localites = []; }
            if (level === 'departements') { zone.sous_prefectures = []; zone.localites = []; }
            if (level === 'sous_prefectures') { zone.localites = []; }

            return { ...prev, zones_intervention: zone }
        })
    }

    const addPartner = () => {
        if (newPartner && !availablePartenaires.includes(newPartner)) {
            setAvailablePartenaires([...availablePartenaires, newPartner])
            toggleArrayItem('partenaires', newPartner)
            setNewPartner('')
        }
    }

    const addBailleur = () => {
        if (newBailleur && !availableBailleurs.includes(newBailleur)) {
            setAvailableBailleurs([...availableBailleurs, newBailleur]);
            toggleArrayItem('bailleurs', newBailleur);
            setNewBailleur('');
        }
    }

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fadeIn bg-gray-50 min-h-screen p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {isEditMode ? 'Modifier le Projet' : 'Nouveau Projet'}
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        {isEditMode ? <span className="font-mono bg-gray-200 px-2 py-0.5 rounded text-sm text-gray-700">{formData.code}</span> : 'Création d\'un nouveau cadre de projet'}
                    </p>
                </div>
                <button onClick={() => navigate('/projects')} className="p-2 text-gray-400 hover:bg-white hover:shadow-sm rounded-full transition-all">
                    <X size={28} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Navigation Tabs */}
                <div className="flex bg-white rounded-xl shadow-sm p-1 sticky top-4 z-20 overflow-x-auto mx-1">
                    {[
                        { id: 'general', label: 'Info. Générales', icon: FileText },
                        { id: 'geo', label: 'Zones & Cible', icon: MapPin },
                        { id: 'criteria', label: 'Critères', icon: CheckSquare },
                        { id: 'kpi', label: 'Objectifs', icon: Calendar }, // Reused icon
                        { id: 'partners', label: 'Partenaires', icon: Plus },
                        { id: 'docs', label: 'Documents', icon: Upload }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-8 max-w-4xl">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nom du Projet</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nom}
                                        onChange={e => setFormData({ ...formData, nom: e.target.value.toUpperCase() })}
                                        className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none uppercase font-bold text-lg"
                                        placeholder="EX: AUTONOMISATION DES FILLES DU NORD"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de Début</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date_debut}
                                        onChange={e => setFormData({ ...formData, date_debut: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de Fin</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date_fin}
                                        onChange={e => setFormData({ ...formData, date_fin: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Durée Calculée</label>
                                    <div className="w-full px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 font-bold text-sm">
                                        {durationDetail || '—'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description & Contexte</label>
                                <textarea
                                    rows="4"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                                    placeholder="Objectif global du projet..."
                                ></textarea>
                            </div>
                        </div>
                    )}

                    {/* ZONES & CIBLE TAB (New V2 Logic) */}
                    {activeTab === 'geo' && (
                        <div className="space-y-10">
                            {/* Cible Demographics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Pays Cible(s) (Afrique de l'Ouest)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {UEMOA_COUNTRIES.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => toggleArrayItem('pays_cible', c)}
                                                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${formData.pays_cible.includes(c)
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Genre Cible</h3>
                                    <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm inline-flex">
                                        {['FEMME', 'HOMME', 'MIXTE'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, genre_cible: g })}
                                                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${formData.genre_cible === g
                                                    ? 'bg-primary-600 text-white shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Cascading Locations */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="text-primary-600" />
                                    <h3 className="text-lg font-bold text-gray-900">Zone d'Intervention Géographique</h3>
                                </div>

                                {/* 1. Regions */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">1. Régions</label>
                                    <div className="max-h-40 overflow-y-auto p-4 border rounded-xl bg-white grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <label className={`flex items-center gap-2 p-2 rounded cursor-pointer ${formData.zones_intervention.regions.includes('TOUTES') ? 'bg-primary-50 ring-1 ring-primary-200' : 'hover:bg-gray-50'}`}>
                                            <input type="checkbox"
                                                checked={formData.zones_intervention.regions.includes('TOUTES')}
                                                onChange={() => toggleLocation('regions', 'TOUTES')}
                                                className="rounded text-primary-600"
                                            />
                                            <span className="font-bold text-sm">TOUTES LES RÉGIONS</span>
                                        </label>
                                        {regions.map(r => (
                                            <label key={r} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50">
                                                <input type="checkbox"
                                                    checked={formData.zones_intervention.regions.includes(r)}
                                                    onChange={() => toggleLocation('regions', r)}
                                                    className="rounded text-primary-600"
                                                />
                                                <span className="text-sm text-gray-700">{r}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Departements */}
                                {(formData.zones_intervention.regions.length > 0 && !formData.zones_intervention.regions.includes('TOUTES')) && (
                                    <div className="space-y-2 animate-fadeIn">
                                        <label className="text-xs font-bold text-gray-500 uppercase">2. Départements (dans les régions sélectionnées)</label>
                                        <div className="max-h-40 overflow-y-auto p-4 border rounded-xl bg-white grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <label className={`flex items-center gap-2 p-2 rounded cursor-pointer ${formData.zones_intervention.departements.includes('TOUS') ? 'bg-primary-50' : ''}`}>
                                                <input type="checkbox"
                                                    checked={formData.zones_intervention.departements.includes('TOUS')}
                                                    onChange={() => toggleLocation('departements', 'TOUS')}
                                                    className="rounded text-primary-600"
                                                />
                                                <span className="font-bold text-sm">TOUS LES DÉPARTEMENTS</span>
                                            </label>
                                            {activeDepartements.map((d, idx) => (
                                                <label key={`dept-${idx}`} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50">
                                                    <input type="checkbox"
                                                        checked={formData.zones_intervention.departements.includes(d)}
                                                        onChange={() => toggleLocation('departements', d)}
                                                        className="rounded text-primary-600"
                                                    />
                                                    <span className="text-sm text-gray-700">{d}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Sous-Prefectures */}
                                {(formData.zones_intervention.departements.length > 0 && !formData.zones_intervention.departements.includes('TOUS')) && (
                                    <div className="space-y-2 animate-fadeIn">
                                        <label className="text-xs font-bold text-gray-500 uppercase">3. Sous-Préfectures</label>
                                        <div className="max-h-40 overflow-y-auto p-4 border rounded-xl bg-white grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <label className={`flex items-center gap-2 p-2 rounded cursor-pointer ${formData.zones_intervention.sous_prefectures.includes('TOUTES') ? 'bg-primary-50' : ''}`}>
                                                <input type="checkbox"
                                                    checked={formData.zones_intervention.sous_prefectures.includes('TOUTES')}
                                                    onChange={() => toggleLocation('sous_prefectures', 'TOUTES')}
                                                    className="rounded text-primary-600"
                                                />
                                                <span className="font-bold text-sm">TOUTES</span>
                                            </label>
                                            {activeSousPrefectures.map((sp, idx) => (
                                                <label key={`sp-${idx}`} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50">
                                                    <input type="checkbox"
                                                        checked={formData.zones_intervention.sous_prefectures.includes(sp)}
                                                        onChange={() => toggleLocation('sous_prefectures', sp)}
                                                        className="rounded text-primary-600"
                                                    />
                                                    <span className="text-sm text-gray-700">{sp}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 4. Localites */}
                                {(formData.zones_intervention.sous_prefectures.length > 0 && !formData.zones_intervention.sous_prefectures.includes('TOUTES')) && (
                                    <div className="space-y-2 animate-fadeIn">
                                        <label className="text-xs font-bold text-gray-500 uppercase">4. Localités Spécifiques</label>
                                        <div className="max-h-40 overflow-y-auto p-4 border rounded-xl bg-white grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {activeLocalites.length === 0 ? <p className="text-sm text-gray-400 p-2 col-span-4">Aucune localité trouvée</p> :
                                                activeLocalites.map((loc, idx) => (
                                                    <label key={`loc-${idx}`} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50">
                                                        <input type="checkbox"
                                                            checked={formData.zones_intervention.localites?.includes(loc)}
                                                            onChange={() => toggleLocation('localites', loc)}
                                                            className="rounded text-primary-600"
                                                        />
                                                        <span className="text-sm text-gray-700">{loc}</span>
                                                    </label>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CRITERIA TAB - Restored Education/Diploma */}
                    {activeTab === 'criteria' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Age & Nationalite */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">Conditions de Base</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité Requise</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableNationalites.map(nat => (
                                                <button
                                                    key={nat}
                                                    type="button"
                                                    onClick={() => toggleCriteriaItem('nationalite', nat)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${formData.criteres_admission.nationalite?.includes(nat)
                                                        ? 'bg-orange-100 border-orange-200 text-orange-800 font-bold'
                                                        : 'bg-white border-gray-200 text-gray-600'
                                                        }`}
                                                >
                                                    {nat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Âge Min</label>
                                            <input type="number" value={formData.criteres_admission.age_min} onChange={e => setFormData({ ...formData, criteres_admission: { ...formData.criteres_admission, age_min: parseInt(e.target.value) } })} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Âge Max</label>
                                            <input type="number" value={formData.criteres_admission.age_max} onChange={e => setFormData({ ...formData, criteres_admission: { ...formData.criteres_admission, age_max: parseInt(e.target.value) } })} className="w-full px-4 py-2 border rounded-lg" />
                                        </div>
                                    </div>
                                </div>

                                {/* Education Level & Diploma - RESTORED */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">Profil Éducatif</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Niveau Scolaire Accepté</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableNiveaux.map(niv => (
                                                <button
                                                    key={niv}
                                                    type="button"
                                                    onClick={() => toggleCriteriaItem('niveau_scolaire', niv)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${formData.criteres_admission.niveau_scolaire?.includes(niv)
                                                        ? 'bg-blue-100 border-blue-200 text-blue-800 font-bold'
                                                        : 'bg-white border-gray-200 text-gray-600'
                                                        }`}
                                                >
                                                    {niv}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Diplômes Requis/Acceptés</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableDiplomes.map(dip => (
                                                <button
                                                    key={dip}
                                                    type="button"
                                                    onClick={() => toggleCriteriaItem('diplome', dip)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${formData.criteres_admission.diplome?.includes(dip)
                                                        ? 'bg-indigo-100 border-indigo-200 text-indigo-800 font-bold'
                                                        : 'bg-white border-gray-200 text-gray-600'
                                                        }`}
                                                >
                                                    {dip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PARTNERS - With Custom Input */}
                    {activeTab === 'partners' && (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b pb-2">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase">Avantages du Projet</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {availableAvantages.map(av => (
                                        <button
                                            key={av}
                                            type="button"
                                            onClick={() => toggleArrayItem('avantages', av)}
                                            className={`p-3 rounded-lg border text-left text-sm transition-all flex items-center gap-2 ${formData.avantages.includes(av)
                                                ? 'bg-teal-50 border-teal-200 text-teal-800 font-medium'
                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {formData.avantages.includes(av) && <CheckSquare size={16} />}
                                            {av}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Centres Associés */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b pb-2">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase">Centres de Service Civique Associés</h3>
                                    <span className="text-xs text-gray-500">{formData.centre_ids.length} sélectionné(s)</span>
                                </div>
                                {centres.length === 0 ? (
                                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                                        Aucun centre disponible. Créez d'abord des centres.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2">
                                        {centres.map(centre => (
                                            <label
                                                key={centre.id}
                                                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.centre_ids.includes(centre.id)
                                                        ? 'bg-primary-50 border-primary-200 shadow-sm'
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.centre_ids.includes(centre.id)}
                                                    onChange={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            centre_ids: prev.centre_ids.includes(centre.id)
                                                                ? prev.centre_ids.filter(id => id !== centre.id)
                                                                : [...prev.centre_ids, centre.id]
                                                        }))
                                                    }}
                                                    className="rounded text-primary-600"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-gray-900">{centre.nom}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{centre.code}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Bailleurs - Custom Input Added */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase">Bailleurs Financiers</h3>
                                        <div className="flex gap-1">
                                            <input type="text" value={newBailleur} onChange={e => setNewBailleur(e.target.value)} placeholder="Autre..." className="text-xs border p-1 rounded w-24" />
                                            <button type="button" onClick={addBailleur} className="bg-gray-200 p-1 rounded hover:bg-gray-300"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {availableBailleurs.map(b => (
                                            <label key={b} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                                <input type="checkbox" checked={formData.bailleurs.includes(b)} onChange={() => toggleArrayItem('bailleurs', b)} className="rounded text-primary-600" />
                                                <span className="text-sm font-medium">{b}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Partners - Custom Input Exists */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase">Partenaires d'Exécution</h3>
                                        <div className="flex gap-1">
                                            <input type="text" value={newPartner} onChange={e => setNewPartner(e.target.value)} placeholder="Autre..." className="text-xs border p-1 rounded w-24" />
                                            <button type="button" onClick={addPartner} className="bg-gray-200 p-1 rounded hover:bg-gray-300"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {availablePartenaires.map(p => (
                                            <label key={p} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                                <input type="checkbox" checked={formData.partenaires.includes(p)} onChange={() => toggleArrayItem('partenaires', p)} className="rounded text-primary-600" />
                                                <span className="text-sm font-medium">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* KPI & DOCS - Kept mostly same but cleaner */}
                    {activeTab === 'kpi' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                                <div className="text-4xl font-black text-purple-600 mb-2">
                                    <input type="number" value={formData.cible_quantitative} onChange={e => setFormData({ ...formData, cible_quantitative: e.target.value })} className="bg-transparent text-center w-full focus:outline-none" />
                                </div>
                                <p className="text-sm font-bold text-purple-900 uppercase">Cible Quantitative</p>
                            </div>
                            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 text-center">
                                <div className="text-4xl font-black text-green-600 mb-2 flex justify-center items-center gap-1">
                                    <input type="number" value={formData.objectif_reclassement} onChange={e => setFormData({ ...formData, objectif_reclassement: e.target.value })} className="bg-transparent text-center w-24 focus:outline-none" />
                                    <span>%</span>
                                </div>
                                <p className="text-sm font-bold text-green-900 uppercase">Objectif Insertion</p>
                            </div>
                            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                                <div className="text-4xl font-black text-red-600 mb-2 flex justify-center items-center gap-1">
                                    <input type="number" value={formData.taux_abandon_max} onChange={e => setFormData({ ...formData, taux_abandon_max: e.target.value })} className="bg-transparent text-center w-24 focus:outline-none" />
                                    <span>%</span>
                                </div>
                                <p className="text-sm font-bold text-red-900 uppercase">Abandon Max</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                                <Upload className="text-gray-400 mb-4 h-12 w-12" />
                                <h4 className="font-bold text-gray-900">Convention Signée</h4>
                                {isEditMode && formData.convention_url ? (
                                    <div className="mt-3 mb-4">
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${formData.convention_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-600 hover:underline text-sm font-medium flex items-center gap-2 justify-center"
                                        >
                                            📄 Fichier existant - Télécharger
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1 mb-4">{files.convention?.name || 'Aucun fichier'}</p>
                                )}
                                <label className="bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg cursor-pointer hover:bg-gray-50">
                                    {isEditMode && formData.convention_url ? 'Remplacer...' : 'Parcourir...'}
                                    <input type="file" className="hidden" onChange={e => setFiles({ ...files, convention: e.target.files[0] })} />
                                </label>
                            </div>
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                                <Upload className="text-gray-400 mb-4 h-12 w-12" />
                                <h4 className="font-bold text-gray-900">TDR Validés</h4>
                                {isEditMode && formData.tdr_url ? (
                                    <div className="mt-3 mb-4">
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${formData.tdr_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-600 hover:underline text-sm font-medium flex items-center gap-2 justify-center"
                                        >
                                            📄 Fichier existant - Télécharger
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1 mb-4">{files.tdr?.name || 'Aucun fichier'}</p>
                                )}
                                <label className="bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg cursor-pointer hover:bg-gray-50">
                                    {isEditMode && formData.tdr_url ? 'Remplacer...' : 'Parcourir...'}
                                    <input type="file" className="hidden" onChange={e => setFiles({ ...files, tdr: e.target.files[0] })} />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <button
                        type="button"
                        onClick={() => navigate('/projects')}
                        className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        {loading ? 'Traitement...' : <><Save size={20} /> Enregistrer le Projet</>}
                    </button>
                </div>

            </form>
        </div>
    )
}
