import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api, { projectsAPI, cohortesAPI, centresAPI, API_BASE_URL } from '../services/api'
import {
    Save, X, Activity, User, Calendar, Search, Check, AlertTriangle, Heart, Stethoscope,
    Filter, RefreshCw, UserCheck, XCircle, CheckCircle, Phone, ShieldAlert, Thermometer, MapPin,
    Mail, Users, Building, Briefcase, GraduationCap, Baby, Edit, FileText, ArrowLeft
} from 'lucide-react'

// Clés localStorage
const STORAGE_KEYS = {
    MEDECIN: 'visite_medecin_nom',
    ETABLISSEMENT: 'visite_etablissement'
}

// Motifs d'inaptitude
const MOTIFS_INAPTITUDE = [
    { id: 'grossesse', label: 'Test de grossesse positif' },
    { id: 'age_limite', label: 'Âge hors limites' },
    { id: 'vue_deficiente', label: 'Déficience visuelle' },
    { id: 'audition_deficiente', label: 'Déficience auditive' },
    { id: 'cardiopathie', label: 'Cardiopathie grave' },
    { id: 'hypertension', label: 'Hypertension non contrôlée' },
    { id: 'diabete_desequilibre', label: 'Diabète déséquilibré' },
    { id: 'asthme_severe', label: 'Asthme sévère' },
    { id: 'handicap_moteur', label: 'Handicap moteur' },
    { id: 'epilepsie', label: 'Épilepsie non stabilisée' },
    { id: 'trouble_psychiatrique', label: 'Trouble psychiatrique' },
    { id: 'infection_active', label: 'Infection active' },
    { id: 'tuberculose', label: 'Tuberculose active' },
    { id: 'hepatite', label: 'Hépatite B/C active' },
    { id: 'vih', label: 'VIH non stabilisé' },
    { id: 'imc_extreme', label: 'IMC extrême' },
    { id: 'addiction', label: 'Addiction active' },
    { id: 'autre', label: 'Autre motif' }
]

// Options examens cliniques
const EXAM_OPTIONS = {
    vision: ['Normal', 'Corrigé (lunettes)', 'Myopie légère', 'Myopie sévère', 'Déficient'],
    audition: ['Normal', 'Hypoacousie légère', 'Hypoacousie moyenne', 'Déficient'],
    buccodentaire: ['Bon état', 'Caries à traiter', 'Dents manquantes', 'Mauvais état'],
    coeur_poumons: ['RAS', 'Souffle cardiaque', 'Arythmie', 'Râles pulmonaires', 'Anormal'],
    etat_general: ['Bon', 'Assez bon', 'Moyen', 'Mauvais'],
    abdomen: ['RAS', 'Douleur à la palpation', 'Hépatomégalie', 'Masse palpable'],
    peau: ['Normal', 'Cicatrices', 'Lésions bénignes', 'Dermatose', 'Mycose'],
    membres_superieurs: ['RAS', 'Limitation mobilité', 'Douleur', 'Déformation'],
    membres_inferieurs: ['RAS', 'Limitation mobilité', 'Varices', 'Œdème', 'Déformation']
}

// Conditions rapides
const QUICK_CONDITIONS = {
    antecedents: [
        { id: 'diabete', label: 'Diabète' },
        { id: 'hta', label: 'HTA' },
        { id: 'epilepsie', label: 'Épilepsie' },
        { id: 'cardiaque', label: 'Pb cardiaque' },
        { id: 'drepanocytose', label: 'Drépanocytose' },
        { id: 'ulcere', label: 'Ulcère' },
        { id: 'hernie', label: 'Hernie' }
    ],
    infections: [
        { id: 'paludisme', label: 'Paludisme' },
        { id: 'typhoid', label: 'Typhoïde' },
        { id: 'tuberculose', label: 'Tuberculose' },
        { id: 'hepatite_b', label: 'Hépatite B' },
        { id: 'hepatite_c', label: 'Hépatite C' },
        { id: 'vih', label: 'VIH' },
        { id: 'ist', label: 'IST' }
    ],
    chirurgies: [
        { id: 'cesarienne', label: 'Césarienne' },
        { id: 'appendicite', label: 'Appendicectomie' },
        { id: 'hernie_op', label: 'Hernie opérée' },
        { id: 'autre_chir', label: 'Autre' }
    ]
}

export default function VisiteMedicaleFormComplete() {
    const { id, candidateId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [candidate, setCandidate] = useState(null)
    const [visiteExistante, setVisiteExistante] = useState(null)

    // Déterminer le mode: vue, édition, ou création
    const isEditMode = location.pathname.includes('/edit')
    const isViewMode = id && !candidateId && !isEditMode && !location.pathname.includes('/new')
    const isCreateMode = !id || candidateId || location.pathname.includes('/new')

    // Recherche et filtres
    const [searchQuery, setSearchQuery] = useState('')
    const [pendingCandidates, setPendingCandidates] = useState([])
    const [candidatesLoading, setCandidatesLoading] = useState(false)
    const [candidatesPagination, setCandidatesPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 20 })
    const [projects, setProjects] = useState([])
    const [cohortes, setCohortes] = useState([])
    const [centres, setCentres] = useState([])
    const [filters, setFilters] = useState({ projet_id: '', cohorte_id: '', centre_id: '' })
    const [showFilters, setShowFilters] = useState(false)
    const searchRef = useRef(null)
    const debounceRef = useRef(null)

    // Villes/Localités autocomplete
    const [localites, setLocalites] = useState([])
    const [villeQuery, setVilleQuery] = useState('')
    const [showVilleResults, setShowVilleResults] = useState(false)
    const [filteredLocalites, setFilteredLocalites] = useState([])
    const villeRef = useRef(null)

    // Motifs et conditions
    const [motifsInaptitude, setMotifsInaptitude] = useState([])
    const [autreMotif, setAutreMotif] = useState('')
    const [selectedConditions, setSelectedConditions] = useState({
        antecedents: [],
        infections: [],
        chirurgies: []
    })

    const [formData, setFormData] = useState({
        candidate_id: candidateId || id || '',
        date_visite: new Date().toISOString().split('T')[0],
        ville_visite: '',
        medecin_nom: localStorage.getItem(STORAGE_KEYS.MEDECIN) || '',
        etablissement: localStorage.getItem(STORAGE_KEYS.ETABLISSEMENT) || '',
        taille: '',
        poids: '',
        imc: '',
        interpretation_imc: '',
        temperature: '',
        tension_arterielle: '',
        pouls: '',
        pignet: '',
        av: '',
        vision: '',
        audition: '',
        buccodentaire: '',
        bdc: '',
        peau: '',
        coeur_poumons: '',
        abdomen: '',
        membres_superieurs: '',
        membres_inferieurs: '',
        etat_general: 'Bon',
        asthmatique: false,
        handicap: false,
        test_grossesse: '',
        grossesse: false,
        groupe_sanguin: '',
        allergies: '',
        maladies_chroniques: '',
        apte_physiquement: true,
        observations: ''
    })

    // Charger filtres et localités
    useEffect(() => {
        Promise.all([
            projectsAPI.getAll().catch(() => ({ data: [] })),
            cohortesAPI.getAll().catch(() => ({ data: [] })),
            centresAPI.getAll().catch(() => ({ data: [] }))
        ]).then(([projRes, cohRes, cenRes]) => {
            setProjects(projRes.data.data || projRes.data || [])
            const cohortesData = cohRes.data.data || cohRes.data || []
            setCohortes(cohortesData)
            const centresData = cenRes.data.data || cenRes.data || []
            setCentres(centresData)

            // Collecter toutes les localités depuis cohortes, centres et candidates
            const allLocalites = new Set()

            // Depuis cohortes
            cohortesData.forEach(c => {
                if (c.region) allLocalites.add(c.region)
                if (c.departement) allLocalites.add(c.departement)
                if (c.sous_prefecture) allLocalites.add(c.sous_prefecture)
                if (c.localite) allLocalites.add(c.localite)
            })

            // Depuis centres
            centresData.forEach(c => {
                if (c.ville) allLocalites.add(c.ville)
                if (c.region) allLocalites.add(c.region)
                if (c.adresse) allLocalites.add(c.adresse)
            })

            // Charger aussi les villes des candidates
            api.get('/candidates', { params: { limit: 2000 } })
                .then(res => {
                    const candidates = res.data.data || res.data || []
                    candidates.forEach(c => {
                        if (c.ville) allLocalites.add(c.ville)
                        if (c.region) allLocalites.add(c.region)
                        if (c.departement) allLocalites.add(c.departement)
                        if (c.sous_prefecture) allLocalites.add(c.sous_prefecture)
                        if (c.localite) allLocalites.add(c.localite)
                    })
                    setLocalites([...allLocalites].filter(Boolean).sort())
                })
                .catch(() => setLocalites([...allLocalites].filter(Boolean).sort()))
        })
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setInitialLoading(true)
            try {
                // Mode vue ou édition: charger la visite existante
                if (id && !candidateId && !location.pathname.includes('/new')) {
                    const visiteResponse = await api.get(`/visites-medicales/${id}`)
                    const visite = visiteResponse.data
                    setVisiteExistante(visite)

                    // Charger le candidat associé
                    if (visite.candidate_id) {
                        await loadCandidate(visite.candidate_id)
                    }

                    // Pré-remplir le formulaire avec les données de la visite
                    setFormData({
                        candidate_id: visite.candidate_id,
                        date_visite: visite.date_visite ? visite.date_visite.split('T')[0] : '',
                        ville_visite: visite.ville_visite || '',
                        medecin_nom: visite.medecin_nom || '',
                        etablissement: visite.etablissement || '',
                        taille: visite.taille || '',
                        poids: visite.poids || '',
                        imc: visite.imc || '',
                        interpretation_imc: visite.interpretation_imc || '',
                        temperature: visite.temperature || '',
                        tension_arterielle: visite.tension_arterielle || '',
                        pouls: visite.pouls || '',
                        pignet: visite.pignet || '',
                        av: visite.av || '',
                        vision: visite.vision || '',
                        audition: visite.audition || '',
                        buccodentaire: visite.buccodentaire || '',
                        bdc: visite.bdc || '',
                        peau: visite.peau || '',
                        coeur_poumons: visite.coeur_poumons || '',
                        abdomen: visite.abdomen || '',
                        membres_superieurs: visite.membres_superieurs || '',
                        membres_inferieurs: visite.membres_inferieurs || '',
                        etat_general: visite.etat_general || 'Bon',
                        asthmatique: visite.asthmatique || false,
                        handicap: visite.handicap || false,
                        test_grossesse: visite.test_grossesse || '',
                        grossesse: visite.grossesse || false,
                        groupe_sanguin: visite.groupe_sanguin || '',
                        allergies: visite.allergies || '',
                        maladies_chroniques: visite.maladies_chroniques || '',
                        apte_physiquement: visite.apte_physiquement !== false,
                        observations: visite.observations || ''
                    })
                    setVilleQuery(visite.ville_visite || '')
                }
                // Mode création avec candidat pré-sélectionné
                else if (candidateId) {
                    await loadCandidate(candidateId)
                }
            } catch (error) {
                console.error('Erreur chargement:', error)
                toast.error('Erreur lors du chargement des données')
            } finally {
                setInitialLoading(false)
            }
        }

        loadData()
    }, [id, candidateId, location.pathname])

    // Filtrer localités
    useEffect(() => {
        if (villeQuery.length >= 1) {
            const filtered = localites.filter(v => v.toLowerCase().includes(villeQuery.toLowerCase())).slice(0, 15)
            setFilteredLocalites(filtered)
        } else {
            setFilteredLocalites(localites.slice(0, 15))
        }
    }, [villeQuery, localites])

    useEffect(() => {
        if (formData.medecin_nom) localStorage.setItem(STORAGE_KEYS.MEDECIN, formData.medecin_nom)
    }, [formData.medecin_nom])

    useEffect(() => {
        if (formData.etablissement) localStorage.setItem(STORAGE_KEYS.ETABLISSEMENT, formData.etablissement)
    }, [formData.etablissement])

    // Calcul IMC
    useEffect(() => {
        if (formData.taille && formData.poids) {
            const taille = parseFloat(formData.taille)
            const poids = parseFloat(formData.poids)
            if (taille > 0 && poids > 0) {
                const tailleEnMetres = taille / 100
                const imc = (poids / (tailleEnMetres * tailleEnMetres)).toFixed(2)
                let interpretation = ''
                if (imc < 18.5) interpretation = 'Maigreur'
                else if (imc < 25) interpretation = 'Normal'
                else if (imc < 30) interpretation = 'Surpoids'
                else interpretation = 'Obésité'
                const pignet = (taille - poids).toFixed(2)
                setFormData(prev => ({ ...prev, imc, interpretation_imc: interpretation, pignet }))
            }
        } else {
            setFormData(prev => ({ ...prev, imc: '', interpretation_imc: '', pignet: '' }))
        }
    }, [formData.taille, formData.poids])

    const loadPendingCandidates = useCallback(async (page = 1, search = '') => {
        setCandidatesLoading(true)
        try {
            const params = { page, limit: 20 }
            if (search && search.length >= 2) params.search = search
            if (filters.projet_id) params.projet_id = filters.projet_id
            if (filters.cohorte_id) params.cohorte_id = filters.cohorte_id
            if (filters.centre_id) params.centre_id = filters.centre_id

            const response = await api.get('/visites-medicales/candidates/pending', { params })
            setPendingCandidates(response.data.data || [])
            setCandidatesPagination(response.data.pagination || { page: 1, total: 0, totalPages: 0, limit: 20 })
        } catch {
            // Fallback: charger depuis /candidates avec statut Sélectionné
            try {
                const params = { page, limit: 20, statut: 'Sélectionné' }
                if (search && search.length >= 2) params.search = search
                if (filters.projet_id) params.projet_id = filters.projet_id
                if (filters.cohorte_id) params.cohorte_id = filters.cohorte_id
                if (filters.centre_id) params.centre_id = filters.centre_id

                const response = await api.get('/candidates', { params })
                setPendingCandidates(response.data.data || [])
                setCandidatesPagination(response.data.pagination || { page: 1, total: 0, totalPages: 0, limit: 20 })
            } catch { setPendingCandidates([]) }
        } finally { setCandidatesLoading(false) }
    }, [filters])

    // Charger les candidats au montage et quand les filtres changent
    useEffect(() => {
        if (isCreateMode && !candidateId && !candidate) {
            loadPendingCandidates(1, searchQuery)
        }
    }, [isCreateMode, candidateId, candidate, filters, loadPendingCandidates])

    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => loadPendingCandidates(1, value), 400)
    }

    const selectCandidate = (candidateData) => {
        setCandidate(candidateData)
        setFormData(prev => ({ ...prev, candidate_id: candidateData.id }))
        setSearchQuery('')
    }

    const loadCandidate = async (candidateId) => {
        try {
            const response = await api.get(`/candidates/${candidateId}`)
            setCandidate(response.data)
            setFormData(prev => ({ ...prev, candidate_id: candidateId }))
            setSearchQuery(`${response.data.prenom} ${response.data.nom}`)
        } catch { toast.error('Erreur lors du chargement') }
    }

    const toggleMotif = (motifId) => {
        setMotifsInaptitude(prev => prev.includes(motifId) ? prev.filter(m => m !== motifId) : [...prev, motifId])
    }

    const toggleCondition = (category, conditionId) => {
        setSelectedConditions(prev => ({
            ...prev,
            [category]: prev[category].includes(conditionId) ? prev[category].filter(c => c !== conditionId) : [...prev[category], conditionId]
        }))
    }

    // Auto-détection inaptitude
    useEffect(() => {
        let shouldBeInapte = false
        const autoMotifs = []
        if (formData.test_grossesse === 'POSITIF') {
            shouldBeInapte = true
            if (!motifsInaptitude.includes('grossesse')) autoMotifs.push('grossesse')
        }
        const imc = parseFloat(formData.imc)
        if (imc && (imc < 16 || imc > 40)) {
            shouldBeInapte = true
            if (!motifsInaptitude.includes('imc_extreme')) autoMotifs.push('imc_extreme')
        }
        if (selectedConditions.infections.includes('tuberculose') || selectedConditions.infections.includes('vih')) {
            shouldBeInapte = true
        }
        if (autoMotifs.length > 0) setMotifsInaptitude(prev => [...new Set([...prev, ...autoMotifs])])
        if (shouldBeInapte && formData.apte_physiquement) setFormData(prev => ({ ...prev, apte_physiquement: false }))
    }, [formData.test_grossesse, formData.imc, selectedConditions.infections])

    useEffect(() => {
        const allConditions = [
            ...selectedConditions.antecedents.map(id => QUICK_CONDITIONS.antecedents.find(c => c.id === id)?.label),
            ...selectedConditions.infections.map(id => QUICK_CONDITIONS.infections.find(c => c.id === id)?.label),
            ...selectedConditions.chirurgies.map(id => QUICK_CONDITIONS.chirurgies.find(c => c.id === id)?.label),
            formData.asthmatique ? 'Asthme' : null
        ].filter(Boolean)
        if (allConditions.length > 0) setFormData(prev => ({ ...prev, maladies_chroniques: allConditions.join(', ') }))
    }, [selectedConditions, formData.asthmatique])

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Ne pas permettre la soumission en mode vue
        if (isViewMode) return

        if (!formData.candidate_id) { toast.error('Veuillez sélectionner une candidate'); return }
        if (!formData.medecin_nom) { toast.error('Le nom du médecin est obligatoire'); return }
        if (candidate?.sexe === 'F' && !formData.test_grossesse) { toast.error('Test de grossesse obligatoire'); return }
        if (!formData.apte_physiquement && motifsInaptitude.length === 0) { toast.error('Sélectionnez un motif d\'inaptitude'); return }

        setLoading(true)
        try {
            const contreIndications = motifsInaptitude.map(motifId => {
                const motif = MOTIFS_INAPTITUDE.find(m => m.id === motifId)
                return { motif: motif?.label || motifId, niveau: 'MAJEURE', details: motifId === 'autre' ? autreMotif : '' }
            })
            const dataToSend = {
                ...formData,
                taille: formData.taille ? parseFloat(formData.taille) : null,
                poids: formData.poids ? parseFloat(formData.poids) : null,
                temperature: formData.temperature ? parseFloat(formData.temperature) : null,
                contre_indications: contreIndications,
                observations: formData.observations + (!formData.apte_physiquement ? `\n\nMOTIFS: ${contreIndications.map(c => c.motif).join(', ')}` : '')
            }

            let response
            if (isEditMode && id) {
                // Mode édition - PUT
                response = await api.put(`/visites-medicales/${id}`, dataToSend)
                toast.success('Visite médicale mise à jour')
            } else {
                // Mode création - POST
                response = await api.post('/visites-medicales', dataToSend)
                if (response.data.statut === 'VALIDE') toast.success('✅ Candidate admise!')
                else toast.error('❌ Candidate inapte')
            }
            navigate('/visites-medicales')
        } catch (error) { toast.error(error.response?.data?.error || 'Erreur') }
        finally { setLoading(false) }
    }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false)
            if (villeRef.current && !villeRef.current.contains(e.target)) setShowVilleResults(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : ''
    const selectVille = (ville) => { setFormData(prev => ({ ...prev, ville_visite: ville })); setVilleQuery(ville); setShowVilleResults(false) }

    const getIMCBg = () => {
        if (!formData.interpretation_imc) return 'bg-gray-100'
        if (formData.interpretation_imc === 'Normal') return 'bg-green-100 text-green-800'
        if (formData.interpretation_imc === 'Maigreur') return 'bg-orange-100 text-orange-800'
        return 'bg-red-100 text-red-800'
    }

    // Export PDF
    const handleExportPDF = () => {
        if (!id) return
        const token = localStorage.getItem('token')
        window.open(`${API_BASE_URL}/api/visites-medicales/export/pdf/${id}?token=${token}`, '_blank')
    }

    // Affichage chargement initial
    if (initialLoading) {
        return (
            <div className="max-w-6xl mx-auto flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* En-tête avec navigation et actions */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/visites-medicales')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                        <ArrowLeft size={18} className="text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {isViewMode ? 'Fiche de Visite Médicale' : isEditMode ? 'Modifier la Visite' : 'Nouvelle Visite Médicale'}
                        </h1>
                        <p className="text-xs text-gray-500">
                            {isViewMode ? 'Consultation des résultats' : isEditMode ? 'Modification des données' : 'Sélectionnez une candidate puis saisissez les résultats'}
                        </p>
                    </div>
                </div>

                {/* Boutons d'action pour le mode vue */}
                {isViewMode && visiteExistante && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                        >
                            <FileText size={16} />
                            PDF
                        </button>
                        <button
                            onClick={() => navigate(`/visites-medicales/${id}/edit`)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B3A5C] text-white rounded-lg hover:bg-[#234E78] transition-colors text-sm font-medium shadow-sm"
                        >
                            <Edit size={16} />
                            Modifier
                        </button>
                    </div>
                )}
            </div>

            {/* Résumé du statut pour le mode vue */}
            {isViewMode && visiteExistante && (
                <div className={`mb-5 p-4 rounded-xl border-2 ${visiteExistante.statut === 'VALIDE' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {visiteExistante.statut === 'VALIDE' ? (
                                <CheckCircle size={32} className="text-green-600" />
                            ) : (
                                <XCircle size={32} className="text-red-600" />
                            )}
                            <div>
                                <p className={`text-lg font-bold ${visiteExistante.statut === 'VALIDE' ? 'text-green-800' : 'text-red-800'}`}>
                                    {visiteExistante.statut === 'VALIDE' ? 'APTE' : 'INAPTE'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Visite du {formatDate(visiteExistante.date_visite)} • Dr. {visiteExistante.medecin_nom || 'N/A'}
                                </p>
                            </div>
                        </div>
                        {visiteExistante.observations && (
                            <div className="text-sm text-gray-600 max-w-md">
                                <span className="font-medium">Observations:</span> {visiteExistante.observations}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SÉLECTION CANDIDATE - seulement en mode création sans candidat pré-sélectionné */}
            {isCreateMode && !candidateId && !candidate && (
                <div className="bg-white rounded-xl shadow-sm border p-5 mb-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Candidates en attente de visite</h2>
                                <p className="text-xs text-gray-500">{candidatesPagination.total} candidate(s) avec statut "Sélectionné"</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg ${showFilters ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            <Filter size={12} /> Filtres
                        </button>
                    </div>

                    {/* Filtres */}
                    {showFilters && (
                        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                            <select value={filters.projet_id} onChange={(e) => setFilters({ ...filters, projet_id: e.target.value })} className="px-2 py-1.5 text-sm border rounded-lg bg-white">
                                <option value="">Tous projets</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                            </select>
                            <select value={filters.cohorte_id} onChange={(e) => setFilters({ ...filters, cohorte_id: e.target.value })} className="px-2 py-1.5 text-sm border rounded-lg bg-white">
                                <option value="">Toutes cohortes</option>
                                {cohortes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                            <select value={filters.centre_id} onChange={(e) => setFilters({ ...filters, centre_id: e.target.value })} className="px-2 py-1.5 text-sm border rounded-lg bg-white">
                                <option value="">Tous centres</option>
                                {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Barre de recherche */}
                    <div ref={searchRef} className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" value={searchQuery} onChange={handleSearchChange}
                            placeholder="Rechercher par nom, prénom..." className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm" />
                        {candidatesLoading && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />}
                    </div>

                    {/* Liste des candidats */}
                    {candidatesLoading && pendingCandidates.length === 0 ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                        </div>
                    ) : pendingCandidates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <UserCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Aucune candidate en attente de visite</p>
                            <p className="text-xs mt-1">Les candidates doivent avoir le statut "Sélectionné"</p>
                        </div>
                    ) : (
                        <>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Candidate</th>
                                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Contact</th>
                                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Localisation</th>
                                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Cohorte / Centre</th>
                                            <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {pendingCandidates.map((c) => (
                                            <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                                            {c.prenom?.charAt(0)}{c.nom?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{c.prenom} {c.nom}</p>
                                                            <p className="text-xs text-gray-500">{c.sexe === 'F' ? 'Femme' : 'Homme'} • {c.age ? `${c.age} ans` : formatDate(c.date_naissance)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <p className="text-xs text-gray-700">{c.telephone || '-'}</p>
                                                    <p className="text-xs text-gray-400">{c.email || '-'}</p>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <p className="text-xs text-gray-700">{c.ville || '-'}</p>
                                                    <p className="text-xs text-gray-400">{c.region || '-'}</p>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {c.cohorte_nom && <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] mb-0.5">{c.cohorte_nom}</span>}
                                                    {c.centre_nom && <span className="block text-[11px] text-gray-500">{c.centre_nom}</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button type="button" onClick={() => selectCandidate(c)}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors font-medium">
                                                        Sélectionner
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {candidatesPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                    <p className="text-xs text-gray-500">
                                        Page {candidatesPagination.page} / {candidatesPagination.totalPages} ({candidatesPagination.total} résultats)
                                    </p>
                                    <div className="flex gap-1">
                                        <button type="button" disabled={candidatesPagination.page <= 1}
                                            onClick={() => loadPendingCandidates(candidatesPagination.page - 1, searchQuery)}
                                            className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                            Précédent
                                        </button>
                                        <button type="button" disabled={candidatesPagination.page >= candidatesPagination.totalPages}
                                            onClick={() => loadPendingCandidates(candidatesPagination.page + 1, searchQuery)}
                                            className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                            Suivant
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* FICHE CANDIDATE ET FORMULAIRE */}
            {candidate && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Bandeau titre institutionnel */}
                    <div className="bg-gradient-to-r from-[#1B3A5C] to-[#234E78] px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Stethoscope size={20} className="text-white/80" />
                            <div>
                                <h2 className="text-white font-semibold text-sm tracking-wide">FICHE D'EXAMEN MEDICAL</h2>
                                <p className="text-blue-200 text-[11px]">Programme Girl Power - Visite d'aptitude</p>
                            </div>
                        </div>
                        {isCreateMode && (
                            <button type="button" onClick={() => { setCandidate(null); setFormData(prev => ({...prev, candidate_id: ''})) }}
                                className="text-blue-200 hover:text-white text-xs flex items-center gap-1 transition-colors">
                                <X size={14} /> Changer de candidate
                            </button>
                        )}
                    </div>

                    {/* Fiche identité candidate */}
                    <div className="bg-gradient-to-b from-gray-50 to-white px-6 py-4 border-b">
                        <div className="flex gap-5">
                            {/* Photo */}
                            <div className="w-[120px] h-[140px] rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 flex-shrink-0 shadow-sm">
                                {candidate.photo ? (
                                    <img src={candidate.photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <User className="w-14 h-14" />
                                    </div>
                                )}
                            </div>

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{candidate.prenom} <span className="uppercase">{candidate.nom}</span></h3>
                                        <p className="text-sm text-gray-500">
                                            {candidate.sexe === 'F' ? 'Femme' : 'Homme'} - {candidate.age ? `${candidate.age} ans` : ''} - {formatDate(candidate.date_naissance)}
                                        </p>
                                    </div>
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] font-medium border border-amber-200">
                                        {candidate.statut || 'Sélectionné'}
                                    </span>
                                </div>

                                {/* Grille infos 2 colonnes */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[13px]">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone size={13} className="text-gray-400 flex-shrink-0" />
                                        <span>{candidate.telephone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                                        <span>{candidate.ville || 'N/A'}{candidate.region ? `, ${candidate.region}` : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail size={13} className="text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{candidate.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Briefcase size={13} className="text-gray-400 flex-shrink-0" />
                                        <span>{candidate.metier_choisi || 'Non défini'}</span>
                                    </div>
                                </div>

                                {/* Tags programme */}
                                <div className="flex flex-wrap gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                                    {candidate.projet_nom && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-medium">
                                            <Building size={11} /> {candidate.projet_nom}
                                        </span>
                                    )}
                                    {candidate.cohorte_nom && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium">
                                            <Users size={11} /> {candidate.cohorte_nom}
                                        </span>
                                    )}
                                    {candidate.centre_nom && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded text-[11px] font-medium">
                                            <Building size={11} /> {candidate.centre_nom}
                                        </span>
                                    )}
                                    {candidate.nombre_enfants_charge > 0 && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded text-[11px]">
                                            <Baby size={11} /> {candidate.nombre_enfants_charge} enfant(s)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FORMULAIRE */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Ligne 1: Infos visite */}
                        <div className="grid grid-cols-4 gap-3 p-4 bg-blue-50/50 rounded-lg">
                            <div className="col-span-4 flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-blue-600" />
                                <span className="text-xs font-semibold text-gray-700">Informations Visite</span>
                            </div>
                            <Input label="Date" type="date" value={formData.date_visite} onChange={(v) => setFormData({...formData, date_visite: v})} required />
                            <div ref={villeRef} className="relative">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Ville / Localité</label>
                                <div className="relative">
                                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                    <input type="text" value={villeQuery || formData.ville_visite}
                                        onChange={(e) => { setVilleQuery(e.target.value); setShowVilleResults(true); setFormData({...formData, ville_visite: e.target.value}) }}
                                        onFocus={() => setShowVilleResults(true)} placeholder="Saisir localité..."
                                        className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-lg" />
                                </div>
                                {showVilleResults && filteredLocalites.length > 0 && (
                                    <div className="absolute z-40 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {filteredLocalites.map((v, i) => (
                                            <button key={i} type="button" onClick={() => selectVille(v)} className="w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 border-b last:border-0">{v}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Input label="Médecin *" value={formData.medecin_nom} onChange={(v) => setFormData({...formData, medecin_nom: v})} placeholder="Dr. Nom" required />
                            <Input label="Établissement" value={formData.etablissement} onChange={(v) => setFormData({...formData, etablissement: v})} placeholder="Centre de santé" />
                        </div>

                        {/* Ligne 2: Examens (gauche) + Mesures (droite) */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Examens Cliniques */}
                            <div className="p-4 bg-violet-50/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <Stethoscope size={14} className="text-violet-600" />
                                    <span className="text-xs font-semibold text-gray-700">Examens Cliniques</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <SelectExam label="Vision" value={formData.vision} onChange={(v) => setFormData({...formData, vision: v})} options={EXAM_OPTIONS.vision} />
                                    <SelectExam label="Audition" value={formData.audition} onChange={(v) => setFormData({...formData, audition: v})} options={EXAM_OPTIONS.audition} />
                                    <SelectExam label="Bucco-dent." value={formData.buccodentaire} onChange={(v) => setFormData({...formData, buccodentaire: v})} options={EXAM_OPTIONS.buccodentaire} />
                                    <SelectExam label="Cœur/Poum." value={formData.coeur_poumons} onChange={(v) => setFormData({...formData, coeur_poumons: v})} options={EXAM_OPTIONS.coeur_poumons} />
                                    <SelectExam label="Abdomen" value={formData.abdomen} onChange={(v) => setFormData({...formData, abdomen: v})} options={EXAM_OPTIONS.abdomen} />
                                    <SelectExam label="Peau" value={formData.peau} onChange={(v) => setFormData({...formData, peau: v})} options={EXAM_OPTIONS.peau} />
                                    <SelectExam label="Mbres sup." value={formData.membres_superieurs} onChange={(v) => setFormData({...formData, membres_superieurs: v})} options={EXAM_OPTIONS.membres_superieurs} />
                                    <SelectExam label="Mbres inf." value={formData.membres_inferieurs} onChange={(v) => setFormData({...formData, membres_inferieurs: v})} options={EXAM_OPTIONS.membres_inferieurs} />
                                    <SelectExam label="État gén." value={formData.etat_general} onChange={(v) => setFormData({...formData, etat_general: v})} options={EXAM_OPTIONS.etat_general} />
                                </div>
                                <div className="mt-2">
                                    <Input label="Acuité visuelle (AV)" value={formData.av} onChange={(v) => setFormData({...formData, av: v})} placeholder="10/10" />
                                </div>
                            </div>

                            {/* Mesures */}
                            <div className="p-4 bg-emerald-50/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity size={14} className="text-emerald-600" />
                                    <span className="text-xs font-semibold text-gray-700">Mesures Anthropométriques</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input label="Taille (cm)" type="number" value={formData.taille} onChange={(v) => setFormData({...formData, taille: v})} placeholder="165" />
                                    <Input label="Poids (kg)" type="number" value={formData.poids} onChange={(v) => setFormData({...formData, poids: v})} placeholder="60" />
                                    <Input label="Temp. (°C)" type="number" step="0.1" value={formData.temperature} onChange={(v) => setFormData({...formData, temperature: v})} placeholder="37" />
                                    <Input label="TA" value={formData.tension_arterielle} onChange={(v) => setFormData({...formData, tension_arterielle: v})} placeholder="12/8" />
                                    <Input label="Pouls" value={formData.pouls} onChange={(v) => setFormData({...formData, pouls: v})} placeholder="70" />
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Groupe</label>
                                        <select value={formData.groupe_sanguin} onChange={(e) => setFormData({...formData, groupe_sanguin: e.target.value})} className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white">
                                            <option value="">--</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {formData.imc && (
                                    <div className="flex gap-2 mt-3 pt-2 border-t border-emerald-200">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getIMCBg()}`}>IMC: {formData.imc} ({formData.interpretation_imc})</span>
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">Pignet: {formData.pignet}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ligne 3: Antécédents et Infections */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/50 rounded-lg">
                            <div className="col-span-2 flex items-center gap-2 mb-1">
                                <ShieldAlert size={14} className="text-amber-600" />
                                <span className="text-xs font-semibold text-gray-700">Antécédents & Conditions</span>
                            </div>

                            {/* Antécédents médicaux */}
                            <div>
                                <p className="text-[10px] font-medium text-gray-500 mb-1.5">Antécédents médicaux</p>
                                <div className="flex flex-wrap gap-1">
                                    {QUICK_CONDITIONS.antecedents.map(cond => (
                                        <ToggleChip key={cond.id} label={cond.label} active={selectedConditions.antecedents.includes(cond.id)} onClick={() => toggleCondition('antecedents', cond.id)} />
                                    ))}
                                </div>
                                <label className="flex items-center gap-1.5 mt-2 text-xs cursor-pointer">
                                    <input type="checkbox" checked={formData.asthmatique} onChange={(e) => setFormData({...formData, asthmatique: e.target.checked})} className="w-3.5 h-3.5 rounded" />
                                    Asthmatique
                                </label>
                            </div>

                            {/* Infections */}
                            <div>
                                <p className="text-[10px] font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                                    <Thermometer size={10} className="text-red-500" /> Infections
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {QUICK_CONDITIONS.infections.map(cond => (
                                        <ToggleChip key={cond.id} label={cond.label} active={selectedConditions.infections.includes(cond.id)} onClick={() => toggleCondition('infections', cond.id)} danger={['tuberculose', 'hepatite_b', 'hepatite_c', 'vih'].includes(cond.id)} />
                                    ))}
                                </div>
                            </div>

                            {/* Chirurgies + Allergies sur même ligne */}
                            <div>
                                <p className="text-[10px] font-medium text-gray-500 mb-1.5">Chirurgies</p>
                                <div className="flex flex-wrap gap-1">
                                    {QUICK_CONDITIONS.chirurgies.map(cond => (
                                        <ToggleChip key={cond.id} label={cond.label} active={selectedConditions.chirurgies.includes(cond.id)} onClick={() => toggleCondition('chirurgies', cond.id)} />
                                    ))}
                                </div>
                                <label className="flex items-center gap-1.5 mt-2 text-xs cursor-pointer">
                                    <input type="checkbox" checked={formData.handicap} onChange={(e) => setFormData({...formData, handicap: e.target.checked})} className="w-3.5 h-3.5 rounded" />
                                    Handicap
                                </label>
                            </div>

                            <div>
                                <p className="text-[10px] font-medium text-gray-500 mb-1.5">Allergies</p>
                                <input type="text" value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                                    placeholder="Pénicilline, Arachides..." className="w-full px-2 py-1.5 text-sm border rounded-lg" />
                            </div>
                        </div>

                        {/* Ligne 4: Test Grossesse + Décision */}
                        <div className="grid grid-cols-2 gap-4">
                            {candidate?.sexe === 'F' && (
                                <div className="p-4 bg-pink-50/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Heart size={14} className="text-pink-600" />
                                        <span className="text-xs font-semibold text-gray-700">Test de Grossesse</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setFormData({...formData, test_grossesse: 'NEGATIF'})}
                                            className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
                                                formData.test_grossesse === 'NEGATIF' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-gray-600'
                                            }`}>
                                            <CheckCircle size={14} /> Négatif
                                        </button>
                                        <button type="button" onClick={() => setFormData({...formData, test_grossesse: 'POSITIF'})}
                                            className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
                                                formData.test_grossesse === 'POSITIF' ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 text-gray-600'
                                            }`}>
                                            <XCircle size={14} /> Positif
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className={`p-4 rounded-lg ${formData.apte_physiquement ? 'bg-green-50/50' : 'bg-red-50/50'} ${candidate?.sexe !== 'F' ? 'col-span-2' : ''}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    {formData.apte_physiquement ? <CheckCircle size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}
                                    <span className="text-xs font-semibold text-gray-700">Décision d'Aptitude</span>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <button type="button" onClick={() => !isViewMode && setFormData({...formData, apte_physiquement: true}) && setMotifsInaptitude([])}
                                        disabled={isViewMode}
                                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
                                            formData.apte_physiquement ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-gray-600'
                                        } ${isViewMode ? 'cursor-not-allowed' : ''}`}>
                                        <CheckCircle size={14} /> Apte
                                    </button>
                                    <button type="button" onClick={() => !isViewMode && setFormData({...formData, apte_physiquement: false})}
                                        disabled={isViewMode}
                                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
                                            !formData.apte_physiquement ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 text-gray-600'
                                        } ${isViewMode ? 'cursor-not-allowed' : ''}`}>
                                        <XCircle size={14} /> Inapte
                                    </button>
                                </div>

                                {!formData.apte_physiquement && (
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1"><AlertTriangle size={11} /> Motif(s)</p>
                                        <div className="grid grid-cols-2 gap-1">
                                            {MOTIFS_INAPTITUDE.map((motif) => (
                                                <label key={motif.id} className={`flex items-center gap-1.5 p-1.5 rounded border cursor-pointer text-[10px] ${
                                                    motifsInaptitude.includes(motif.id) ? 'border-red-300 bg-red-100 text-red-800' : 'border-gray-200 bg-white'
                                                }`}>
                                                    <input type="checkbox" checked={motifsInaptitude.includes(motif.id)} onChange={() => toggleMotif(motif.id)} className="sr-only" />
                                                    <div className={`w-3 h-3 rounded border flex items-center justify-center ${motifsInaptitude.includes(motif.id) ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                                                        {motifsInaptitude.includes(motif.id) && <Check size={8} className="text-white" />}
                                                    </div>
                                                    <span className="truncate">{motif.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {motifsInaptitude.includes('autre') && (
                                            <input type="text" value={autreMotif} onChange={(e) => setAutreMotif(e.target.value)} placeholder="Précisez..." className="w-full mt-2 px-2 py-1.5 text-xs border rounded-lg" />
                                        )}
                                    </div>
                                )}

                                <textarea value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})}
                                    placeholder="Observations..." rows={2} className="w-full px-3 py-2 text-sm border rounded-lg" />
                            </div>
                        </div>

                        {/* Actions - seulement en mode édition ou création */}
                        {!isViewMode && (
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => navigate('/visites-medicales')} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 text-sm">
                                    <X size={14} /> Annuler
                                </button>
                                <button type="submit" disabled={loading}
                                    className={`px-5 py-2 rounded-lg text-white font-medium flex items-center gap-1.5 text-sm shadow disabled:opacity-50 ${
                                        formData.apte_physiquement ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}>
                                    <Save size={14} />
                                    {loading ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : (formData.apte_physiquement ? 'Valider APTE' : 'Enregistrer INAPTE')}
                                </button>
                            </div>
                        )}

                        {/* Actions en mode vue */}
                        {isViewMode && (
                            <div className="flex justify-between gap-3 pt-4 border-t">
                                <button type="button" onClick={() => navigate('/visites-medicales')} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 text-sm">
                                    <ArrowLeft size={14} /> Retour à la liste
                                </button>
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleExportPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-sm">
                                        <FileText size={14} /> PDF
                                    </button>
                                    <button type="button" onClick={() => navigate(`/visites-medicales/${id}/edit`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm">
                                        <Edit size={14} /> Modifier
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    )
}

// Composants
function Input({ label, type = 'text', value, onChange, placeholder, required, step, disabled }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} step={step}
                disabled={disabled} readOnly={disabled}
                className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-1 focus:ring-blue-200 ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
        </div>
    )
}

function SelectExam({ label, value, onChange, options, disabled }) {
    const isNormal = value === 'Normal' || value === 'Bon état' || value === 'Bon' || value === 'RAS'
    const isBad = value && (value.includes('Déficient') || value === 'Mauvais état' || value === 'Mauvais' || value.includes('Anormal'))
    return (
        <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-1">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
                className={`w-full px-1.5 py-1.5 text-xs border rounded-lg bg-white ${
                    isNormal ? 'text-green-700 border-green-200 bg-green-50' :
                    isBad ? 'text-red-700 border-red-200 bg-red-50' :
                    value ? 'text-amber-700 border-amber-200 bg-amber-50' : ''
                } ${disabled ? 'cursor-not-allowed' : ''}`}>
                <option value="">--</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    )
}

function ToggleChip({ label, active, onClick, danger = false, disabled }) {
    return (
        <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition ${
                active ? (danger ? 'bg-red-500 text-white' : 'bg-amber-500 text-white') : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {active && <Check size={8} className="inline mr-0.5" />}{label}
        </button>
    )
}
