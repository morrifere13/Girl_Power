import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { cohortesAPI, projectsAPI, centresAPI, locationsAPI } from '../services/api'
import {
    Save, X, Calendar, MapPin, LayoutGrid, Building2,
    Clock, Check, Globe
} from 'lucide-react'

// Helper for duration display
const calculateDuration = (start, end) => {
    if (!start || !end) return '-'
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (endDate < startDate) return 'Invalide'

    const diffTime = Math.abs(endDate - startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) return `${diffDays} jours`
    const months = Math.floor(diffDays / 30)
    const days = diffDays % 30
    return `${months} mois${days > 0 ? `, ${days} jours` : ''}`
}

export default function CohorteForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditMode = !!id

    const [loading, setLoading] = useState(false)

    // Options
    const [projects, setProjects] = useState([])
    const [centres, setCentres] = useState([])
    const [projectZones, setProjectZones] = useState({
        regions: [],
        departements: [],
        sous_prefectures: [],
        localites: []
    })

    // Ref pour éviter le problème de closure stale
    const projectZonesRef = useRef(projectZones)
    const [selectedZones, setSelectedZones] = useState({
        regions: [],
        departements: [],
        sous_prefectures: [],
        localites: []
    })
    const [locations, setLocations] = useState({
        regions: [],
        departements: [],
        sousPrefectures: [],
        localites: []
    })

    // Form Data
    const [formData, setFormData] = useState({
        nom: '',
        projet_id: '',
        centre_ids: [], // Changed to Array

        // Dates
        date_debut_recrutement: '',
        date_fin_recrutement: '',
        date_entree_centre: '',
        date_fin_formation: '',

        // Location
        location_scope: 'GLOBAL', // GLOBAL | SPECIFIC
        region: '',
        departement: '',
        sous_prefecture: '',
        localite: '',

        statut: 'EN_COURS'
    })

    // Mettre à jour la ref quand projectZones change
    useEffect(() => {
        projectZonesRef.current = projectZones
    }, [projectZones])

    useEffect(() => {
        loadInitialData()
        if (isEditMode) loadCohorte()
    }, [id])

    useEffect(() => {
        if (formData.projet_id) {
            loadProjectLocations(formData.projet_id)
        } else {
            setProjectZones({
                regions: [],
                departements: [],
                sous_prefectures: [],
                localites: []
            })
            setSelectedZones({
                regions: [],
                departements: [],
                sous_prefectures: [],
                localites: []
            })
        }
    }, [formData.projet_id])

    useEffect(() => {
        if (selectedZones.regions.length > 0) {
            loadDepartementsForRegions(selectedZones.regions)
        }
    }, [selectedZones.regions])

    useEffect(() => {
        if (selectedZones.departements.length > 0) {
            loadSousPrefecturesForDepartements(selectedZones.departements)
        }
    }, [selectedZones.departements])

    useEffect(() => {
        if (selectedZones.sous_prefectures.length > 0) {
            loadLocalitesForSousPrefectures(selectedZones.sous_prefectures)
        }
    }, [selectedZones.sous_prefectures])

    useEffect(() => {
        // Cascading location loads
        if (formData.region && formData.location_scope === 'SPECIFIC') loadDepartements(formData.region)
    }, [formData.region, formData.location_scope])

    useEffect(() => {
        if (formData.departement) loadSousPrefectures(formData.departement)
    }, [formData.departement])

    useEffect(() => {
        if (formData.sous_prefecture) loadLocalites(formData.sous_prefecture)
    }, [formData.sous_prefecture])

    const loadProjectLocations = async (projectId) => {
        try {
            const res = await projectsAPI.getById(projectId)
            let zones = res.data.zones_intervention || {}

            if (typeof zones === 'string') {
                try {
                    zones = JSON.parse(zones)
                } catch (e) {
                    zones = {}
                }
            }

            let regionsToUse = Array.isArray(zones.regions) ? zones.regions : []

            // Si "TOUTES" est sélectionné, charger toutes les régions depuis l'API
            if (regionsToUse.includes('TOUTES') || regionsToUse.length === 0) {
                try {
                    const regRes = await locationsAPI.getRegions()
                    regionsToUse = regRes.data || []
                } catch (e) {
                    console.error('Erreur chargement régions:', e)
                }
            }

            const newProjectZones = {
                regions: regionsToUse,
                departements: Array.isArray(zones.departements) ? zones.departements : [],
                sous_prefectures: Array.isArray(zones.sous_prefectures) ? zones.sous_prefectures : [],
                localites: Array.isArray(zones.localites) ? zones.localites : []
            }
            console.log('=== loadProjectLocations ===')
            console.log('Project zones from API:', zones)
            console.log('New projectZones:', newProjectZones)
            // Mettre à jour la ref IMMÉDIATEMENT avant setState
            projectZonesRef.current = newProjectZones
            setProjectZones(newProjectZones)
        } catch (error) {
            console.error('Erreur chargement zones projet:', error)
            const emptyZones = {
                regions: [],
                departements: [],
                sous_prefectures: [],
                localites: []
            }
            projectZonesRef.current = emptyZones
            setProjectZones(emptyZones)
        }
    }

    const loadDepartementsForRegions = async (regions) => {
        try {
            if (regions.length === 0) {
                setLocations(prev => ({ ...prev, departements: [] }))
                return
            }

            const currentProjectZones = projectZonesRef.current
            console.log('=== loadDepartementsForRegions ===')
            console.log('Selected regions:', regions)
            console.log('projectZonesRef.current:', currentProjectZones)

            const allDepts = []
            for (const region of regions) {
                const res = await locationsAPI.getDepartements(region)
                const depts = res.data || []
                console.log(`Départements pour ${region}:`, depts)
                // Si projectZones.departements est vide, on prend tous les départements
                if (currentProjectZones.departements.length === 0) {
                    allDepts.push(...depts)
                } else {
                    const filtered = depts.filter(d => currentProjectZones.departements.includes(d))
                    allDepts.push(...filtered)
                }
            }

            const uniqueDepts = [...new Set(allDepts)]
            console.log('Départements finaux:', uniqueDepts)
            setLocations(prev => ({ ...prev, departements: uniqueDepts }))
        } catch (error) {
            console.error('Erreur chargement départements:', error)
            setLocations(prev => ({ ...prev, departements: [] }))
        }
    }

    const loadSousPrefecturesForDepartements = async (departements) => {
        try {
            if (departements.length === 0) {
                setLocations(prev => ({ ...prev, sousPrefectures: [] }))
                return
            }

            const currentProjectZones = projectZonesRef.current
            const allSPs = []
            for (const dept of departements) {
                const res = await locationsAPI.getSousPrefectures(dept)
                const sps = res.data || []
                // Si projectZones.sous_prefectures est vide, on prend toutes les sous-préfectures
                if (currentProjectZones.sous_prefectures.length === 0) {
                    allSPs.push(...sps)
                } else {
                    const filtered = sps.filter(sp => currentProjectZones.sous_prefectures.includes(sp))
                    allSPs.push(...filtered)
                }
            }

            const uniqueSPs = [...new Set(allSPs)]
            setLocations(prev => ({ ...prev, sousPrefectures: uniqueSPs }))
        } catch (error) {
            console.error('Erreur chargement sous-préfectures:', error)
            setLocations(prev => ({ ...prev, sousPrefectures: [] }))
        }
    }

    const loadLocalitesForSousPrefectures = async (sousPrefectures) => {
        try {
            if (sousPrefectures.length === 0) {
                setLocations(prev => ({ ...prev, localites: [] }))
                return
            }

            const currentProjectZones = projectZonesRef.current
            const allLocs = []
            for (const sp of sousPrefectures) {
                const res = await locationsAPI.getLocalites(sp)
                const locs = res.data || []
                // Si projectZones.localites est vide, on prend toutes les localités
                if (currentProjectZones.localites.length === 0) {
                    allLocs.push(...locs)
                } else {
                    const filtered = locs.filter(l => currentProjectZones.localites.includes(l))
                    allLocs.push(...filtered)
                }
            }

            const uniqueLocs = [...new Set(allLocs)]
            setLocations(prev => ({ ...prev, localites: uniqueLocs }))
        } catch (error) {
            console.error('Erreur chargement localités:', error)
            setLocations(prev => ({ ...prev, localites: [] }))
        }
    }


    const loadInitialData = async () => {
        try {
            const [projRes, centreRes, regRes] = await Promise.all([
                projectsAPI.getAll({ limit: 100 }),
                centresAPI.getAll({ limit: 100 }),
                locationsAPI.getRegions()
            ])
            setProjects(Array.isArray(projRes.data) ? projRes.data : (projRes.data.data || []))
            setCentres(Array.isArray(centreRes.data) ? centreRes.data : (centreRes.data.data || []))
            setLocations(prev => ({ ...prev, regions: regRes.data || [] }))
        } catch (error) {
            console.error(error)
            toast.error('Erreur chargement données')
        }
    }

    const loadCohorte = async () => {
        try {
            const res = await cohortesAPI.getById(id)
            const data = res.data

            const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : ''

            setFormData({
                ...data,
                centre_ids: data.centres ? data.centres.map(c => c.id) : [],
                date_debut_recrutement: formatDate(data.date_debut_recrutement),
                date_fin_recrutement: formatDate(data.date_fin_recrutement),
                date_entree_centre: formatDate(data.date_entree_centre),
                date_fin_formation: formatDate(data.date_fin_formation)
            })

            if (data.zones_intervention) {
                if (typeof data.zones_intervention === 'object' && !Array.isArray(data.zones_intervention)) {
                    setSelectedZones(data.zones_intervention)
                }
            }
        } catch (error) {
            toast.error('Erreur chargement cohorte')
            navigate('/cohortes')
        }
    }

    const loadDepartements = async (region) => {
        const res = await locationsAPI.getDepartements(region)
        setLocations(prev => ({ ...prev, departements: res.data || [] }))
    }

    const loadSousPrefectures = async (dept) => {
        const res = await locationsAPI.getSousPrefectures(dept)
        setLocations(prev => ({ ...prev, sousPrefectures: res.data || [] }))
    }

    const loadLocalites = async (sp) => {
        const res = await locationsAPI.getLocalites(sp)
        setLocations(prev => ({ ...prev, localites: res.data || [] }))
    }

    const handleCentreToggle = (centreId) => {
        setFormData(prev => {
            const current = prev.centre_ids || [];
            if (current.includes(centreId)) {
                return { ...prev, centre_ids: current.filter(id => id !== centreId) };
            } else {
                return { ...prev, centre_ids: [...current, centreId] };
            }
        });
    };

    const handleZoneToggle = (type, value) => {
        setSelectedZones(prev => {
            const current = prev[type] || []
            const isSelected = current.includes(value)
            
            if (isSelected) {
                return { ...prev, [type]: current.filter(v => v !== value) }
            } else {
                return { ...prev, [type]: [...current, value] }
            }
        })
    }

    const handleSelectAll = (type) => {
        const allValues = type === 'regions' ? projectZones.regions :
                         type === 'departements' ? locations.departements :
                         type === 'sous_prefectures' ? locations.sousPrefectures :
                         locations.localites
        
        setSelectedZones(prev => ({
            ...prev,
            [type]: allValues
        }))
    }

    const handleDeselectAll = (type) => {
        setSelectedZones(prev => ({
            ...prev,
            [type]: []
        }))
    }

    const isZoneSelected = (type, value) => {
        return (selectedZones[type] || []).includes(value)
    }

    const isAllSelected = (type) => {
        const allValues = type === 'regions' ? projectZones.regions :
                         type === 'departements' ? locations.departements :
                         type === 'sous_prefectures' ? locations.sousPrefectures :
                         locations.localites
        const selected = selectedZones[type] || []
        return allValues.length > 0 && selected.length === allValues.length
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Empêcher les soumissions multiples
        if (loading) return

        setLoading(true)

        const payload = {
            ...formData,
            nom: formData.nom.charAt(0).toUpperCase() + formData.nom.slice(1),
            zones_intervention: selectedZones
        }

        try {
            if (isEditMode) {
                await cohortesAPI.update(id, payload)
                toast.success('Cohorte modifiée avec succès')
            } else {
                await cohortesAPI.create(payload)
                toast.success('Cohorte créée avec succès')
            }
            navigate('/cohortes')
        } catch (error) {
            console.error(error)
            toast.error('Erreur lors de l\'enregistrement')
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">
                        {isEditMode ? 'Modifier la Cohorte' : 'Nouvelle Cohorte'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Configurez les détails, dates et lieux de la session.
                        <br />Le code sera généré automatiquement.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/cohortes')}
                    className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Step 1: Identification */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <LayoutGrid size={18} />
                        </div>
                        Identification
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la Cohorte *</label>
                            <input
                                type="text"
                                name="nom"
                                required
                                placeholder="Ex: Abidjan Session 2024"
                                value={formData.nom}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Projet Lié *</label>
                            <select
                                name="projet_id"
                                required
                                value={formData.projet_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="">Sélectionner un projet</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.nom}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                name="statut"
                                value={formData.statut}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="EN_COURS">En Cours</option>
                                <option value="TERMINEE">Terminée</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Centres de Formation *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border rounded-xl bg-gray-50">
                                {centres.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleCentreToggle(c.id)}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.centre_ids.includes(c.id)
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-gray-200 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${formData.centre_ids.includes(c.id)
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-white border-gray-300'
                                            }`}>
                                            {formData.centre_ids.includes(c.id) && <Check size={14} />}
                                        </div>
                                        <span className={`text-sm ${formData.centre_ids.includes(c.id) ? 'font-medium text-blue-900' : 'text-gray-600'}`}>
                                            {c.nom}
                                        </span>
                                    </div>
                                ))}
                                {centres.length === 0 && (
                                    <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                                        Aucun centre disponible
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {formData.centre_ids.length} centre(s) sélectionné(s)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 2: Planning */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Clock size={18} />
                        </div>
                        Planning & Durées
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        {/* Recrutement */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">Recrutement</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Début</label>
                                    <input type="date" name="date_debut_recrutement" value={formData.date_debut_recrutement} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fin</label>
                                    <input type="date" name="date_fin_recrutement" value={formData.date_fin_recrutement} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                                <Clock size={14} />
                                Durée: {calculateDuration(formData.date_debut_recrutement, formData.date_fin_recrutement)}
                            </div>
                        </div>

                        {/* Formation */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">Formation</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Entrée Centre</label>
                                    <input type="date" name="date_entree_centre" value={formData.date_entree_centre} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fin Formation</label>
                                    <input type="date" name="date_fin_formation" value={formData.date_fin_formation} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                                <Clock size={14} />
                                Durée: {calculateDuration(formData.date_entree_centre, formData.date_fin_formation)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 3: Localisation */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <MapPin size={18} />
                        </div>
                        Localisation
                    </h2>

                    {!formData.projet_id ? (
                        <div className="text-center py-8 text-gray-500">
                            <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">Veuillez d'abord sélectionner un projet</p>
                        </div>
                    ) : projectZones.regions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">Aucune zone d'intervention définie pour ce projet</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Régions */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-bold text-gray-700">
                                        📍 Régions
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => isAllSelected('regions') ? handleDeselectAll('regions') : handleSelectAll('regions')}
                                            className="text-xs font-medium text-orange-600 hover:text-orange-700 underline"
                                        >
                                            {isAllSelected('regions') ? 'Tout désélectionner' : 'Tout sélectionner'}
                                        </button>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {selectedZones.regions.length}/{projectZones.regions.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {projectZones.regions.map((region, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleZoneToggle('regions', region)}
                                            className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${
                                                isZoneSelected('regions', region)
                                                    ? 'bg-orange-50 border-orange-200 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-orange-200'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 flex-shrink-0 transition-colors ${
                                                isZoneSelected('regions', region)
                                                    ? 'bg-orange-600 border-orange-600 text-white'
                                                    : 'bg-white border-gray-300'
                                            }`}>
                                                {isZoneSelected('regions', region) && <Check size={12} />}
                                            </div>
                                            <span className={`text-xs font-medium ${
                                                isZoneSelected('regions', region) ? 'text-orange-900' : 'text-gray-700'
                                            }`}>
                                                {region}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Départements */}
                            {selectedZones.regions.length > 0 && (
                                <div className="animate-fade-in">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-bold text-gray-700">
                                            🏛️ Départements
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => isAllSelected('departements') ? handleDeselectAll('departements') : handleSelectAll('departements')}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                                            >
                                                {isAllSelected('departements') ? 'Tout désélectionner' : 'Tout sélectionner'}
                                            </button>
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {selectedZones.departements.length}/{locations.departements.length}
                                            </span>
                                        </div>
                                    </div>
                                    {locations.departements.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500 text-sm">
                                            Chargement des départements...
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {locations.departements.map((dept, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleZoneToggle('departements', dept)}
                                                    className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${
                                                        isZoneSelected('departements', dept)
                                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                            : 'bg-white border-gray-200 hover:border-blue-200'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 flex-shrink-0 transition-colors ${
                                                        isZoneSelected('departements', dept)
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-white border-gray-300'
                                                    }`}>
                                                        {isZoneSelected('departements', dept) && <Check size={12} />}
                                                    </div>
                                                    <span className={`text-xs font-medium ${
                                                        isZoneSelected('departements', dept) ? 'text-blue-900' : 'text-gray-700'
                                                    }`}>
                                                        {dept}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sous-préfectures */}
                            {selectedZones.departements.length > 0 && (
                                <div className="animate-fade-in">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-bold text-gray-700">
                                            🏘️ Sous-préfectures
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => isAllSelected('sous_prefectures') ? handleDeselectAll('sous_prefectures') : handleSelectAll('sous_prefectures')}
                                                className="text-xs font-medium text-green-600 hover:text-green-700 underline"
                                            >
                                                {isAllSelected('sous_prefectures') ? 'Tout désélectionner' : 'Tout sélectionner'}
                                            </button>
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {selectedZones.sous_prefectures.length}/{locations.sousPrefectures.length}
                                            </span>
                                        </div>
                                    </div>
                                    {locations.sousPrefectures.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500 text-sm">
                                            Chargement des sous-préfectures...
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {locations.sousPrefectures.map((sp, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleZoneToggle('sous_prefectures', sp)}
                                                    className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${
                                                        isZoneSelected('sous_prefectures', sp)
                                                            ? 'bg-green-50 border-green-200 shadow-sm'
                                                            : 'bg-white border-gray-200 hover:border-green-200'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 flex-shrink-0 transition-colors ${
                                                        isZoneSelected('sous_prefectures', sp)
                                                            ? 'bg-green-600 border-green-600 text-white'
                                                            : 'bg-white border-gray-300'
                                                    }`}>
                                                        {isZoneSelected('sous_prefectures', sp) && <Check size={12} />}
                                                    </div>
                                                    <span className={`text-xs font-medium ${
                                                        isZoneSelected('sous_prefectures', sp) ? 'text-green-900' : 'text-gray-700'
                                                    }`}>
                                                        {sp}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Localités */}
                            {selectedZones.sous_prefectures.length > 0 && (
                                <div className="animate-fade-in">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-bold text-gray-700">
                                            📌 Localités
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => isAllSelected('localites') ? handleDeselectAll('localites') : handleSelectAll('localites')}
                                                className="text-xs font-medium text-purple-600 hover:text-purple-700 underline"
                                            >
                                                {isAllSelected('localites') ? 'Tout désélectionner' : 'Tout sélectionner'}
                                            </button>
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {selectedZones.localites.length}/{locations.localites.length}
                                            </span>
                                        </div>
                                    </div>
                                    {locations.localites.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500 text-sm">
                                            Chargement des localités...
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {locations.localites.map((loc, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleZoneToggle('localites', loc)}
                                                    className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${
                                                        isZoneSelected('localites', loc)
                                                            ? 'bg-purple-50 border-purple-200 shadow-sm'
                                                            : 'bg-white border-gray-200 hover:border-purple-200'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 flex-shrink-0 transition-colors ${
                                                        isZoneSelected('localites', loc)
                                                            ? 'bg-purple-600 border-purple-600 text-white'
                                                            : 'bg-white border-gray-300'
                                                    }`}>
                                                        {isZoneSelected('localites', loc) && <Check size={12} />}
                                                    </div>
                                                    <span className={`text-xs font-medium ${
                                                        isZoneSelected('localites', loc) ? 'text-purple-900' : 'text-gray-700'
                                                    }`}>
                                                        {loc}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/cohortes')}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Enregistrer
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

