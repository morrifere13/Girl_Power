import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { candidatesAPI, locationsAPI, projectsAPI, cohortesAPI, centresAPI, API_BASE_URL } from '../services/api'
import {
  Save, X, Plus, Trash2, User, MapPin, FileText, GraduationCap, Baby,
  Heart, Shield, CheckCircle, Upload, Camera, ChevronRight, ChevronLeft,
  Phone, Mail, Calendar, Home, Briefcase, AlertCircle, Check, Paperclip,
  Building2, FolderOpen, School
} from 'lucide-react'

// VERSION 2.0 - Ajout étape Affectation (Projet, Cohorte, Centre) - 2026-01-18 10:30
export default function CandidateFormV3() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [completedSteps, setCompletedSteps] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isNavigating, setIsNavigating] = useState(false) // Fix double-click race condition

  // Location Data States
  const [regionsList, setRegionsList] = useState([])
  const [villesList, setVillesList] = useState([])
  const [lieuSuggestions, setLieuSuggestions] = useState([])
  const [showLieuSuggestions, setShowLieuSuggestions] = useState(false)
  const [villeSuggestions, setVilleSuggestions] = useState([])
  const [showVilleSuggestions, setShowVilleSuggestions] = useState(false)

  // Children & Orphan Status
  const [showChildForm, setShowChildForm] = useState(false)
  const [orphanStatus, setOrphanStatus] = useState('none')
  const [childrenWithCandidate, setChildrenWithCandidate] = useState(false)

  // Affectation Data States
  const [projects, setProjects] = useState([])
  const [cohortes, setCohortes] = useState([])
  const [cohortesFiltered, setCohortesFiltered] = useState([])
  const [centres, setCentres] = useState([])
  const [centresFiltered, setCentresFiltered] = useState([])
  const [projectCentres, setProjectCentres] = useState([])

  const [formData, setFormData] = useState({
    // Identité
    nom: '', prenom: '', surnom: '', date_naissance: '', age: '',
    age_detailed: { years: 0, months: 0, days: 0 },
    lieu_naissance: '', sexe: 'F',

    // Contact
    telephone: '', telephone_2: '', email: '',

    // Localisation
    region: '', region_chef_lieu: '', ville: '', quartier: '',
    repere_logement: '', adresse: '', prix_transport: '',

    // Documents
    type_document: 'Aucun document', numero_document: '', nni: '',
    date_validite_document: '', cmu: '',

    // Formation & Profession
    niveau_etude: 'Aucun', diplome: 'Sans diplôme', annee_diplome: '',
    metier_choisi: '', activite_actuelle: '',
    revenu_mensuel: '', plus_grande_somme_gere: '',

    // Famille
    situation_matrimoniale: 'Célibataire',
    a_des_enfants: false, nombre_enfants: 0, enfants: [],
    nombre_enfants_charge: 0, enfants_au_centre: false,
    aej_numero: '',

    // Parents & Urgence
    pere_vivant: true, pere_nom: '', pere_profession: '',
    pere_contact1: '', pere_contact2: '',
    mere_vivante: true, mere_nom: '', mere_profession: '',
    mere_contact1: '', mere_contact2: '',
    urgence_nom: '', urgence_affiliation: '', urgence_profession: '',
    urgence_contact1: '', urgence_contact2: '',

    // Affectation
    projet_id: '',
    cohorte_id: '',
    centre_id: '',

    statut: 'Inscrit',
    photo: null,
  })

  // Calculate detailed age (years, months, days)
  const calculateDetailedAge = (birthDate) => {
    if (!birthDate) return { years: 0, months: 0, days: 0 }

    const birth = new Date(birthDate)
    const today = new Date()

    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    let days = today.getDate() - birth.getDate()

    if (days < 0) {
      months--
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years--
      months += 12
    }

    return { years, months, days }
  }

  // Load regions and affectation data on mount
  useEffect(() => {
    locationsAPI.getRegions()
      .then(res => setRegionsList(res.data))
      .catch(err => console.error('Error loading regions:', err))

    // Load projects, cohortes, centres
    Promise.all([
      projectsAPI.getAll(),
      cohortesAPI.getAll(),
      centresAPI.getAll()
    ]).then(([projRes, cohRes, centRes]) => {
      const projects = Array.isArray(projRes.data) ? projRes.data : projRes.data?.projects || projRes.data?.data || []
      const cohortes = Array.isArray(cohRes.data) ? cohRes.data : cohRes.data?.cohortes || cohRes.data?.data || []
      const centres = Array.isArray(centRes.data) ? centRes.data : centRes.data?.centres || centRes.data?.data || []

      setProjects(projects)
      setCohortes(cohortes)
      setCentres(centres)
    }).catch(err => console.error('Error loading affectation data:', err))
  }, [])

  // Cascade: Region → Villes
  useEffect(() => {
    if (formData.region) {
      locationsAPI.getVilles(formData.region)
        .then(res => setVillesList(res.data))
        .catch(err => console.error('Error loading villes:', err))
    } else {
      setVillesList([])
    }
  }, [formData.region])

  // Filter cohortes based on projet_id
  useEffect(() => {
    if (formData.projet_id) {
      // Filter cohortes - Only show EN_COURS cohortes from the selected project
      const filteredCohortes = cohortes.filter(c =>
        c.projet_id === parseInt(formData.projet_id) && c.statut === 'EN_COURS'
      )
      setCohortesFiltered(filteredCohortes)

      // Reset cohorte_id if current selection is not in filtered list
      if (formData.cohorte_id && !filteredCohortes.find(c => c.id === parseInt(formData.cohorte_id))) {
        setFormData(prev => ({ ...prev, cohorte_id: '' }))
      }
    } else {
      setCohortesFiltered([])
      if (formData.cohorte_id) {
        setFormData(prev => ({ ...prev, cohorte_id: '' }))
      }
    }
  }, [formData.projet_id, cohortes, formData.cohorte_id])

  // Load centres linked to the selected project
  useEffect(() => {
    if (formData.projet_id) {
      projectsAPI.getById(formData.projet_id)
        .then(res => {
          const projectCentres = res.data.centres || []
          setCentresFiltered(projectCentres)

          // Reset centre_id if current selection is not in the project's centres
          if (formData.centre_id && !projectCentres.find(c => c.id === parseInt(formData.centre_id))) {
            setFormData(prev => ({ ...prev, centre_id: '' }))
          }
        })
        .catch(err => {
          console.error('Error loading project centres:', err)
          setCentresFiltered([])
        })
    } else {
      setCentresFiltered([])
      if (formData.centre_id) {
        setFormData(prev => ({ ...prev, centre_id: '' }))
      }
    }
  }, [formData.projet_id, formData.centre_id])

  // Load candidate data if editing
  useEffect(() => {
    if (isEdit) {
      loadCandidate()
    } else {
      const savedDraft = localStorage.getItem('candidateFormDraftV3')
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft)
          if (!draftData.age_detailed && draftData.date_naissance) {
            draftData.age_detailed = calculateDetailedAge(draftData.date_naissance)
          }
          setFormData(draftData)
          toast('Brouillon restauré', { icon: '📝' })
        } catch (error) {
          console.error('Erreur chargement brouillon:', error)
          localStorage.removeItem('candidateFormDraftV3')
        }
      }
    }
  }, [id, isEdit])

  // Auto-save draft
  useEffect(() => {
    if (!isEdit && formData.nom) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('candidateFormDraftV3', JSON.stringify(formData))
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [formData, isEdit])

  const loadCandidate = async () => {
    try {
      const response = await candidatesAPI.getById(id)
      const ageDetailed = calculateDetailedAge(response.data.date_naissance)

      // Convertir les diplômes de la table en format string
      let diplomesStr = response.data.diplome || 'Sans diplôme'
      if (response.data.diplomes && response.data.diplomes.length > 0) {
        diplomesStr = response.data.diplomes.map(d => d.diplome).join(',')
      }

      setFormData({
        ...response.data,
        diplome: diplomesStr,
        age_detailed: ageDetailed || { years: 0, months: 0, days: 0 }
      })

      if (response.data.photo) {
        setPhotoPreview(`${API_BASE_URL}${response.data.photo}`)
      }

      // Charger les fichiers existants
      if (response.data.fichiers && response.data.fichiers.length > 0) {
        // Convertir les fichiers de la base en objets File-like pour l'affichage
        const filesFromDB = response.data.fichiers.map(f => ({
          name: f.nom_fichier,
          size: f.taille_fichier,
          type: f.type_fichier,
          path: f.chemin_fichier,
          isExisting: true // Marquer comme fichier existant
        }))
        setUploadedFiles(filesFromDB)
      }

      // Determine orphan status
      if (!response.data.pere_vivant && !response.data.mere_vivante) setOrphanStatus('both')
      else if (!response.data.pere_vivant) setOrphanStatus('pere')
      else if (!response.data.mere_vivante) setOrphanStatus('mere')
      else setOrphanStatus('none')

      if (response.data.enfants && response.data.enfants.length > 0) {
        setShowChildForm(true)
      }
    } catch (error) {
      console.error('Erreur chargement candidate:', error)
      toast.error('Erreur lors du chargement')
      navigate('/candidates')
    }
  }

  const capitalize = (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target
    let newValue = type === 'checkbox' ? checked : value

    // Auto-format names
    if (name === 'nom') newValue = newValue.toUpperCase()
    if (name === 'prenom') newValue = value.split(' ').map(capitalize).join(' ')
    if (name === 'surnom') newValue = capitalize(value)

    // Numeric validation for phone numbers
    if (name.includes('contact') || name.includes('telephone')) {
      newValue = value.replace(/\D/g, '').slice(0, 10)
    }

    // Children checkbox behavior
    if (name === 'a_des_enfants') {
      newValue = checked
      if (!newValue) {
        setFormData(prev => ({ ...prev, [name]: false, nombre_enfants: 0, enfants: [] }))
        setShowChildForm(false)
        setChildrenWithCandidate(false)
        return
      } else {
        setShowChildForm(true)
      }
    }

    // Checkbox array handling (for Diplomas)
    if (name === 'diplome') {
      let currentDiplomas = formData.diplome ? formData.diplome.split(',').filter(d => d) : []
      if (checked) {
        currentDiplomas.push(value)
      } else {
        currentDiplomas = currentDiplomas.filter(d => d !== value)
      }
      // If "Aucun" is selected, clear others. If others selected, clear "Aucun"
      if (value === 'Aucun' && checked) {
        currentDiplomas = ['Aucun']
      } else if (value !== 'Aucun' && checked) {
        // Remove both 'Aucun' and 'Sans diplôme' if they exist when selecting a real diploma
        currentDiplomas = currentDiplomas.filter(d => d !== 'Aucun' && d !== 'Sans diplôme')
      }

      newValue = currentDiplomas.join(',')
    }

    setFormData(prev => ({ ...prev, [name]: newValue }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleDateChange = (e) => {
    const date = e.target.value
    if (date) {
      const birthDate = new Date(date)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--

      const ageDetailed = calculateDetailedAge(date)

      setFormData(prev => ({ ...prev, date_naissance: date, age, age_detailed: ageDetailed }))

      // Validate age
      if (age < 15 || age > 65) {
        setErrors(prev => ({ ...prev, date_naissance: 'Âge doit être entre 15 et 65 ans' }))
      } else {
        setErrors(prev => ({ ...prev, date_naissance: '' }))
      }
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Format image invalide')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Image trop volumineuse (max 20MB)')
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormData({ ...formData, photo: null })
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024) // Max 10MB

    if (validFiles.length !== files.length) {
      toast.error('Certains fichiers sont trop volumineux (max 10MB)')
    }

    setUploadedFiles(prev => [...prev, ...validFiles])
    toast.success(`${validFiles.length} fichier(s) ajouté(s)`)
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    toast.success('Fichier supprimé')
  }

  const handleOrphanChange = (status) => {
    setOrphanStatus(status)
    switch (status) {
      case 'none':
        setFormData(prev => ({ ...prev, pere_vivant: true, mere_vivante: true }))
        break
      case 'pere':
        setFormData(prev => ({
          ...prev, pere_vivant: false, mere_vivante: true,
          pere_nom: '', pere_profession: '', pere_contact1: '', pere_contact2: ''
        }))
        break
      case 'mere':
        setFormData(prev => ({
          ...prev, pere_vivant: true, mere_vivante: false,
          mere_nom: '', mere_profession: '', mere_contact1: '', mere_contact2: ''
        }))
        break
      case 'both':
        setFormData(prev => ({
          ...prev, pere_vivant: false, mere_vivante: false,
          pere_nom: '', pere_profession: '', pere_contact1: '', pere_contact2: '',
          mere_nom: '', mere_profession: '', mere_contact1: '', mere_contact2: ''
        }))
        break
      default:
        break
    }
  }

  const handleLieuChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, lieu_naissance: value }))
    if (value.length > 2) {
      locationsAPI.search(value)
        .then(res => {
          setLieuSuggestions(res.data)
          setShowLieuSuggestions(true)
        })
        .catch(console.error)
    } else {
      setLieuSuggestions([])
      setShowLieuSuggestions(false)
    }
  }

  const selectLieu = (lieu) => {
    setFormData(prev => ({ ...prev, lieu_naissance: lieu }))
    setLieuSuggestions([])
    setShowLieuSuggestions(false)
  }

  const handleVilleChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, ville: value }))

    // Vérifier qu'une région est sélectionnée
    if (!formData.region) {
      toast.error('Veuillez d\'abord sélectionner une région')
      return
    }

    if (value.length > 2) {
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
      region: villeData.region,
      region_chef_lieu: villeData.chef_lieu_region
    }))
    setVilleSuggestions([])
    setShowVilleSuggestions(false)
  }

  const handleRegionChange = (e) => {
    const region = e.target.value
    setFormData(prev => ({ ...prev, region, ville: '', region_chef_lieu: '' }))

    // Charger le chef-lieu pour cette région
    if (region) {
      locationsAPI.getChefLieu(region)
        .then(res => {
          if (res.data.chef_lieu) {
            setFormData(prev => ({ ...prev, region_chef_lieu: res.data.chef_lieu }))
          }
        })
        .catch(console.error)
    }
  }

  const handleNombreEnfantsChange = (e) => {
    const nombre = parseInt(e.target.value) || 0
    setFormData(prev => ({ ...prev, nombre_enfants: nombre }))
  }

  const addEnfant = () => {
    const today = new Date().toISOString().split('T')[0]
    setFormData(prev => ({
      ...prev,
      enfants: [
        ...prev.enfants,
        { prenom: '', date_naissance: today, sexe: 'F', au_centre: false, age: 0 }
      ],
      nombre_enfants: parseInt(prev.nombre_enfants || 0) + 1
    }))
  }

  const removeEnfant = (index) => {
    const newEnfants = formData.enfants.filter((_, i) => i !== index)
    setFormData({ ...formData, enfants: newEnfants, nombre_enfants: newEnfants.length })
  }

  const updateEnfant = (index, field, value) => {
    const updatedEnfants = [...formData.enfants]
    updatedEnfants[index] = { ...updatedEnfants[index], [field]: value }

    if (field === 'date_naissance' && value) {
      const birthDate = new Date(value)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--

      updatedEnfants[index].age = age >= 0 ? age : 0
      // updatedEnfants[index].age_detailed = calculateDetailedAge(value) // Removed to avoid potential reference error if function missing
    }

    setFormData({ ...formData, enfants: updatedEnfants })
  }

  const validateStep = (stepIndex) => {
    const newErrors = {}
    let isValid = true

    if (stepIndex === 0) {
      // Step 0: Affectation
      if (!formData.projet_id) { newErrors.projet_id = 'Projet requis'; isValid = false }
      if (!formData.cohorte_id) { newErrors.cohorte_id = 'Cohorte requise'; isValid = false }
      if (!formData.centre_id) { newErrors.centre_id = 'Centre requis'; isValid = false }
    } else if (stepIndex === 1) {
      // Step 1: Identité & Contact
      if (!formData.nom?.trim()) { newErrors.nom = 'Nom requis'; isValid = false }
      if (!formData.prenom?.trim()) { newErrors.prenom = 'Prénom requis'; isValid = false }
      if (!formData.date_naissance) { newErrors.date_naissance = 'Date de naissance requise'; isValid = false }
      if (!formData.telephone?.trim()) { newErrors.telephone = 'Téléphone requis'; isValid = false }

      if (formData.date_naissance) {
        const birthDate = new Date(formData.date_naissance)
        const age = new Date().getFullYear() - birthDate.getFullYear()
        if (age < 15 || age > 65) {
          newErrors.date_naissance = 'Âge doit être entre 15 et 65 ans'
          isValid = false
        }
      }
    } else if (stepIndex === 2) {
      // Step 2: Localisation & Formation
      if (!formData.ville?.trim()) { newErrors.ville = 'Ville requise'; isValid = false }
      if (!formData.metier_choisi?.trim()) { newErrors.metier_choisi = 'Métier requis'; isValid = false }
    } else if (stepIndex === 3) {
      // Step 3: Famille & Urgence
      if (!formData.urgence_contact1?.trim()) { newErrors.urgence_contact1 = 'Contact urgence 1 requis'; isValid = false }
      // urgence_contact2 is optional
    }

    setErrors(newErrors)
    if (!isValid) {
      // Show specific error messages
      const errorMessages = Object.values(newErrors)
      if (errorMessages.length > 0) {
        errorMessages.forEach(msg => toast.error(msg))
      } else {
        toast.error('Veuillez corriger les erreurs avant de continuer')
      }
    }
    return isValid
  }

  const handleNextStep = () => {
    if (isNavigating) return // Prevent double-clicks

    if (validateStep(activeStep)) {
      setIsNavigating(true)
      setCompletedSteps(prev => [...new Set([...prev, activeStep])])
      setActiveStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Release navigation lock after transition animation (approx 500ms)
      setTimeout(() => setIsNavigating(false), 500)
    }
  }

  const handlePrevStep = () => {
    setActiveStep(prev => prev - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStepClick = (stepId) => {
    if (stepId < activeStep || completedSteps.includes(activeStep)) {
      setActiveStep(stepId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (stepId === activeStep + 1) {
      handleNextStep()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Si on n'est pas sur la dernière étape, passer à la suivante au lieu de soumettre
    if (activeStep < steps.length - 1) {
      handleNextStep()
      return
    }

    if (!validateStep(activeStep)) {
      return
    }

    setLoading(true)

    try {
      // Calculer le nombre d'enfants qui accompagnent la candidate au centre
      const enfantsAuCentre = formData.enfants.filter(e => e.au_centre).length

      const dataToSend = {
        ...formData,
        age: parseInt(formData.age) || 0,
        a_des_enfants: Boolean(formData.a_des_enfants),
        nombre_enfants: formData.enfants.length,
        pere_vivant: Boolean(formData.pere_vivant),
        mere_vivante: Boolean(formData.mere_vivante),
        // Sanitize integer fields
        prix_transport: formData.prix_transport ? parseInt(formData.prix_transport) : null,
        annee_diplome: formData.annee_diplome ? parseInt(formData.annee_diplome) : null,
        revenu_mensuel: formData.revenu_mensuel ? parseInt(formData.revenu_mensuel) : null,
        plus_grande_somme_gere: formData.plus_grande_somme_gere ? parseInt(formData.plus_grande_somme_gere) : null,
        nombre_enfants_charge: enfantsAuCentre,
        enfants_au_centre: enfantsAuCentre > 0,
        aej_numero: formData.aej_numero || null
      }

      // Cleanup internal fields not expected by backend
      delete dataToSend.age_detailed
      if (dataToSend.enfants) {
        dataToSend.enfants = dataToSend.enfants.map(e => {
          const { age_detailed, ...rest } = e
          let age = e.age
          if (age === '' || age === null || age === undefined) {
            age = null
          } else {
            age = parseInt(age)
            if (isNaN(age)) {
              age = null
            } else {
              age = Math.max(0, age)
            }
          }

          return {
            ...rest,
            au_centre: Boolean(e.au_centre),
            date_naissance: e.date_naissance || null,
            age: age
          }
        })
      }

      console.log('🔍 DEBUG - dataToSend before API call:', {
        type_document: dataToSend.type_document,
        numero_document: dataToSend.numero_document,
        date_validite_document: dataToSend.date_validite_document,
        enfants: dataToSend.enfants,
        uploadedFiles: uploadedFiles,
        newFilesCount: uploadedFiles.filter(f => !f.isExisting).length
      })

      let candidateId = id

      if (isEdit) {
        await candidatesAPI.update(id, dataToSend)
        toast.success('Modifications enregistrées!')
      } else {
        const response = await candidatesAPI.create(dataToSend)
        candidateId = response.data.id
        toast.success('Candidate créée avec succès!')
      }

      if (photoFile && candidateId) {
        await candidatesAPI.uploadPhoto(candidateId, photoFile)
        toast.success('Photo ajoutée')
      }

      // Upload uniquement les nouveaux fichiers (pas ceux qui existent déjà)
      const newFiles = uploadedFiles.filter(f => !f.isExisting)
      if (newFiles.length > 0 && candidateId) {
        await candidatesAPI.uploadFichiers(candidateId, newFiles)
        toast.success(`${newFiles.length} fichier(s) ajouté(s)`)
      }

      if (!isEdit) localStorage.removeItem('candidateFormDraftV3')
      navigate('/candidates')
    } catch (error) {
      console.error('❌ Erreur complète:', error)
      console.error('❌ Response data:', error.response?.data)
      console.error('❌ Response status:', error.response?.status)

      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        const messages = error.response.data.details.map(d => d.message).join('\n')
        toast.error('Erreur de validation:\n' + messages, { duration: 5000 })
        console.error('Validation errors:', error.response.data.details)
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Une erreur est survenue'
        toast.error(errorMessage)
        console.error('Error message:', errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 0, title: 'Affectation', icon: Building2, description: 'Projet, cohorte et centre' },
    { id: 1, title: 'Identité & Contact', icon: User, description: 'Informations personnelles' },
    { id: 2, title: 'Localisation & Formation', icon: MapPin, description: 'Adresse et métier' },
    { id: 3, title: 'Famille & Urgence', icon: Heart, description: 'Parents et contacts d\'urgence' }
  ]

  const metiers = [
    'Pâtisserie - Cuisine', 'Coiffure - Esthétique', 'Mécanique Auto',
    'Construction Métallique', 'Agro-pastorale', 'Couture - Mode',
    'Informatique', 'Commerce', 'Autre'
  ]

  const EDUCATION_LEVELS = [
    { label: 'Primaire', options: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'] },
    { label: 'Collège', options: ['6ème', '5ème', '4ème', '3ème'] },
    { label: 'Lycée', options: ['2nde', '1ère', 'Terminale'] },
    { label: 'Supérieur', options: ['Universitaire 1ère année', 'Universitaire 2ème année', 'Licence', 'Master', 'Doctorat'] },
    { label: 'Aucun', options: ['Aucun'] }
  ]

  const AVAILABLE_DIPLOMAS = [
    'CEPE', 'BEPC', 'BAC', 'Licence', 'Master', 'Doctorat', 'BTS', 'DUT'
  ]

  // Helper to get allowed diplomas based on level (optional logic, but user said "diplomes s'affiche en fonction des niveau")
  // Let's make it smarter: logic to suggest/filter or just show all but highlight relevant?
  // User said "diplomes s'affiche en fonction des niveau" -> diplomas appear based on level.
  const getDiplomasForLevel = (level) => {
    if (!level || level === 'Aucun') return ['Aucun']

    // Primaire
    if (['CP1', 'CP2', 'CE1', 'CE2', 'CM1'].includes(level)) return ['Aucun']
    if (level === 'CM2') return ['CEPE', 'Aucun']

    // Collège
    if (['6ème', '5ème', '4ème'].includes(level)) return ['CEPE', 'Aucun']
    if (level === '3ème') return ['CEPE', 'BEPC', 'Aucun']

    // Lycée
    if (['2nde', '1ère'].includes(level)) return ['CEPE', 'BEPC', 'Aucun']
    if (level === 'Terminale') return ['CEPE', 'BEPC', 'BAC', 'Aucun']

    // Supérieur
    if (level.includes('Universitaire') || ['Licence', 'Master', 'Doctorat'].includes(level)) return ['CEPE', 'BEPC', 'BAC', 'BTS', 'DUT', 'Licence', 'Master', 'Doctorat', 'Aucun']
    return AVAILABLE_DIPLOMAS
  }

  const affiliations = ['Père', 'Mère', 'Oncle', 'Tante', 'Frère', 'Sœur', 'Tuteur', 'Autre']

  // Check if NNI should be enabled
  const isNNIEnabled = formData.type_document === "Carte d'identité"

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header - Institutional Style */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <User size={28} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEdit ? 'Modification du Dossier' : 'Nouveau Dossier Stagiaire'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {isEdit ? `Mise à jour - ${formData.prenom} ${formData.nom}` : 'Formulaire d\'inscription en 4 étapes'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/candidates')}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Annuler</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Stepper - Institutional Style */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">

            {/* Progress Bar Background */}
            <div className="absolute top-7 left-0 right-0 h-0.5 bg-gray-200" />
            {/* Progress Bar Active */}
            <div
              className="absolute top-7 left-0 h-0.5 bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
            />

            {/* Step Indicators */}
            <div className="relative flex justify-between">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx
                const isCompleted = completedSteps.includes(idx) || activeStep > idx
                const Icon = step.icon

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepClick(step.id)}
                    className="flex flex-col items-center group focus:outline-none"
                    disabled={idx > activeStep + 1 && !completedSteps.includes(activeStep)}
                  >
                    {/* Circle */}
                    <div className={`
                      relative w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-300 mb-3 border-2
                      ${isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : isCompleted
                          ? 'bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-200 text-gray-400'
                      }
                    `}>
                      {isCompleted && !isActive ? (
                        <Check className="w-6 h-6" strokeWidth={2.5} />
                      ) : (
                        <Icon className="w-6 h-6" strokeWidth={2} />
                      )}
                    </div>

                    {/* Label */}
                    <div className="text-center max-w-[140px]">
                      <div className={`text-xs font-semibold uppercase tracking-wide transition-colors ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                        Étape {idx + 1}
                      </div>
                      <div className={`text-sm font-medium mt-0.5 ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                        {step.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Form Card - Institutional Style */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (activeStep < steps.length - 1) {
                handleNextStep()
              }
            }
          }}
          className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >

          {/* Form Content */}
          <div className="p-6 sm:p-8 md:p-10 min-h-[600px]">

            {/* STEP 2: IDENTITÉ & CONTACT */}
            {activeStep === 1 && (
              <div className="space-y-6 animate-fadeIn">

                {/* Photo Upload Section - Institutional */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-lg bg-white border-2 border-gray-300 shadow-sm flex items-center justify-center overflow-hidden">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    {photoPreview && (
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-6 h-6 text-white" />
                        </button>
                      )}
                    </div>
                    <label className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-flex items-center gap-2 font-medium shadow-sm">
                      <Upload className="w-4 h-4" />
                      {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                      <input
                        type="file"
                        onChange={handlePhotoChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG ou GIF (max 5MB)</p>
                  </div>
                </div>

                {/* Identité */}
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informations Personnelles
                  </h3>
                  <p className="text-sm text-gray-600">Identité et contact</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.nom ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="NOM DE FAMILLE"
                      />
                      {errors.nom && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.nom}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Automatiquement en majuscules</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénoms <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.prenom ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Prénoms complets"
                      />
                      {errors.prenom && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.prenom}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Surnom
                      </label>
                      <input
                        type="text"
                        name="surnom"
                        value={formData.surnom}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Surnom (optionnel)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sexe
                      </label>
                      <select
                        name="sexe"
                        value={formData.sexe}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="F">Féminin</option>
                        <option value="M">Masculin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de naissance <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="date_naissance"
                          value={formData.date_naissance?.split('T')[0] || ''}
                          onChange={handleDateChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.date_naissance ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.date_naissance && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.date_naissance}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Âge
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-center font-semibold text-gray-700">
                          {formData.age_detailed?.years > 0 && (
                            <span>{formData.age_detailed?.years} ans </span>
                          )}
                          {formData.age_detailed?.months > 0 && (
                            <span>{formData.age_detailed?.months} mois </span>
                          )}
                          {formData.age_detailed?.days > 0 && (
                            <span>{formData.age_detailed?.days} jours</span>
                          )}
                          {(!formData.age_detailed || (formData.age_detailed.years === 0 && formData.age_detailed.months === 0 && formData.age_detailed.days === 0)) && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lieu de naissance
                      </label>
                      <input
                        type="text"
                        name="lieu_naissance"
                        value={formData.lieu_naissance}
                        onChange={handleLieuChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Ville ou village de naissance"
                        autoComplete="off"
                      />
                      {showLieuSuggestions && lieuSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                          {lieuSuggestions.map((lieu, i) => (
                            <li
                              key={i}
                              onClick={() => selectLieu(lieu)}
                              className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
                            >
                              {lieu}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    Coordonnées
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.telephone ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="22334455"
                          maxLength="10"
                        />
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.telephone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.telephone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone 2
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="telephone_2"
                          value={formData.telephone_2}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Optionnel"
                          maxLength="10"
                        />
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="exemple@email.com (optionnel)"
                        />
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 3: LOCALISATION & FORMATION */}
            {activeStep === 2 && (
              <div className="space-y-8 animate-fadeIn">

                {/* Localisation */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    Localisation
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Région <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleRegionChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Sélectionner une région</option>
                        {regionsList.map((region, i) => (
                          <option key={i} value={region}>{region}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">Le chef-lieu se remplira automatiquement</p>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville / Village <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="ville"
                        value={formData.ville}
                        onChange={handleVilleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.ville ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Tapez pour rechercher une ville ou village..."
                        autoComplete="off"
                      />
                      {showVilleSuggestions && villeSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                          {villeSuggestions.map((ville, i) => (
                            <li
                              key={i}
                              onClick={() => selectVille(ville)}
                              className="px-4 py-2 hover:bg-primary-50 cursor-pointer transition-colors"
                            >
                              <div className="font-medium">{ville.ville}</div>
                              <div className="text-xs text-gray-500">
                                {ville.sous_prefecture && `SP: ${ville.sous_prefecture} • `}
                                {ville.departement && `Dept: ${ville.departement}`}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {errors.ville && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.ville}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quartier
                      </label>
                      <input
                        type="text"
                        name="quartier"
                        value={formData.quartier}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nom du quartier"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse
                      </label>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Adresse complète"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chef-lieu de la région
                      </label>
                      <input
                        type="text"
                        name="region_chef_lieu"
                        value={formData.region_chef_lieu}
                        readOnly
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="Auto-rempli selon la ville"
                      />
                      <p className="mt-1 text-xs text-gray-500">Ce champ se remplit automatiquement quand vous sélectionnez une ville</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repère logement
                      </label>
                      <input
                        type="text"
                        name="repere_logement"
                        value={formData.repere_logement}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Point de repère pour trouver le logement"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix transport (FCFA)
                      </label>
                      <input
                        type="number"
                        name="prix_transport"
                        value={formData.prix_transport}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Coût du transport"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    Documents d'identité
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de document
                      </label>
                      <select
                        name="type_document"
                        value={formData.type_document}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="Aucun document">Aucun document</option>
                        <option value="Carte d'identité">Carte d'identité</option>
                        <option value="Passeport">Passeport</option>
                        <option value="Extrait de naissance">Extrait de naissance</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de document
                      </label>
                      <input
                        type="text"
                        name="numero_document"
                        value={formData.numero_document}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_document: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Numéro du document"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NNI {isNNIEnabled && <span className="text-sm text-gray-500">(activé pour carte d'identité)</span>}
                      </label>
                      <input
                        type="text"
                        name="nni"
                        value={formData.nni}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value)) handleChange(e)
                        }}
                        disabled={!isNNIEnabled}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!isNNIEnabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300'
                          }`}
                        placeholder={isNNIEnabled ? "Numéro National d'Identification" : "Sélectionnez 'Carte d'identité' d'abord"}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CMU
                      </label>
                      <input
                        type="text"
                        name="cmu"
                        value={formData.cmu}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value)) handleChange(e)
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Couverture Maladie Universelle"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de validité du document
                      </label>
                      <input
                        type="date"
                        name="date_validite_document"
                        value={formData.date_validite_document?.split('T')[0] || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        N° AEJ (Agence pour l'Emploi des Jeunes)
                      </label>
                      <input
                        type="text"
                        name="aej_numero"
                        value={formData.aej_numero}
                        onChange={(e) => setFormData(prev => ({ ...prev, aej_numero: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Numéro AEJ (optionnel)"
                      />
                    </div>
                  </div>
                </div>

                {/* Formation & Métier */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-orange-600" />
                    </div>
                    Formation & Métier
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Niveau d'étude
                      </label>
                      <select
                        name="niveau_etude"
                        value={formData.niveau_etude}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Sélectionner le niveau precis</option>
                        {EDUCATION_LEVELS.map((group, groupIdx) => (
                          <optgroup key={groupIdx} label={group.label}>
                            {group.options.map((option, optIdx) => (
                              <option key={`${groupIdx}-${optIdx}`} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diplôme(s) obtenu(s)
                      </label>
                      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                        {(!formData.niveau_etude) ? (
                          <p className="text-sm text-gray-400 italic text-center">Sélectionnez d'abord un niveau d'étude</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {getDiplomasForLevel(formData.niveau_etude).map((dip) => {
                              const isChecked = formData.diplome ? formData.diplome.split(',').includes(dip) : false
                              return (
                                <label key={dip} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded transition-colors">
                                  <input
                                    type="checkbox"
                                    name="diplome"
                                    value={dip}
                                    checked={isChecked}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{dip}</span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {formData.diplome && formData.diplome.split(',').map((d, i) => (
                          d && <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Métier choisi <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="metier_choisi"
                        value={formData.metier_choisi}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.metier_choisi ? 'border-red-500' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Sélectionner un métier</option>
                        {metiers.map((metier, i) => (
                          <option key={i} value={metier}>{metier}</option>
                        ))}
                      </select>
                      {errors.metier_choisi && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.metier_choisi}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activité actuelle
                      </label>
                      <input
                        type="text"
                        name="activite_actuelle"
                        value={formData.activite_actuelle}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Que faites-vous actuellement?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Année d'obtention du diplôme
                      </label>
                      <input
                        type="text"
                        name="annee_diplome"
                        value={formData.annee_diplome}
                        onChange={(e) => {
                          if (/^\d{0,4}$/.test(e.target.value)) handleChange(e)
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Ex: 2020"
                        maxLength="4"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Revenu mensuel (FCFA)
                      </label>
                      <input
                        type="number"
                        name="revenu_mensuel"
                        value={formData.revenu_mensuel}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Revenu mensuel moyen"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plus grande somme gérée (FCFA)
                      </label>
                      <input
                        type="number"
                        name="plus_grande_somme_gere"
                        value={formData.plus_grande_somme_gere}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Montant maximum géré"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Fichiers */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Paperclip className="w-5 h-5 text-indigo-600" />
                    </div>
                    Pièces jointes
                  </h3>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 transition-colors">
                    <div className="text-center">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <label className="cursor-pointer">
                        <span className="text-sm text-gray-600">
                          Glissez vos fichiers ici ou{' '}
                          <span className="text-blue-600 font-medium hover:underline">
                            cliquez pour parcourir
                          </span>
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX, JPG, PNG (max 20MB par fichier)
                      </p>
                    </div>

                    {/* Liste des fichiers uploadés */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Fichiers ajoutés ({uploadedFiles.length})
                        </p>
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* STEP 1: AFFECTATION */}
            {activeStep === 0 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Affectation Institutionnelle
                  </h3>
                  <p className="text-sm text-gray-600">
                    Projet, cohorte et centre de formation
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Projet */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="w-4 h-4 text-blue-600" />
                          Projet <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <select
                        name="projet_id"
                        value={formData.projet_id}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white ${
                          errors.projet_id ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Sélectionnez un projet</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.nom}</option>
                        ))}
                      </select>
                      {errors.projet_id && <p className="text-xs text-red-500 mt-1">{errors.projet_id}</p>}
                      {!errors.projet_id && <p className="text-xs text-gray-500 mt-1">Sélectionnez d'abord le projet</p>}
                    </div>

                    {/* Cohorte */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="flex items-center gap-1.5">
                          <School className="w-4 h-4 text-blue-600" />
                          Cohorte <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <select
                        name="cohorte_id"
                        value={formData.cohorte_id}
                        onChange={handleChange}
                        disabled={!formData.projet_id}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.cohorte_id ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                        }`}
                      >
                        <option value="">
                          {formData.projet_id ? 'Sélectionnez une cohorte' : 'Sélectionnez d\'abord un projet'}
                        </option>
                        {cohortesFiltered.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nom} {c.code ? `(${c.code})` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.cohorte_id && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cohorte_id}</p>}
                      {!errors.cohorte_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.projet_id
                            ? `${cohortesFiltered.length} cohorte(s) en cours disponible(s)`
                            : 'Choisissez un projet d\'abord'}
                        </p>
                      )}
                    </div>

                    {/* Centre */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          Centre <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <select
                        name="centre_id"
                        value={formData.centre_id}
                        onChange={handleChange}
                        disabled={!formData.projet_id}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.centre_id ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                        }`}
                      >
                        <option value="">
                          {formData.projet_id ? 'Sélectionnez un centre' : 'Sélectionnez d\'abord un projet'}
                        </option>
                        {centresFiltered.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nom} {c.code ? `(${c.code})` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.centre_id && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.centre_id}</p>}
                      {!errors.centre_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.projet_id
                            ? `${centresFiltered.length} centre(s) du projet disponible(s)`
                            : 'Choisissez un projet d\'abord'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Info card si tout est sélectionné */}
                  {formData.projet_id && formData.cohorte_id && formData.centre_id && (
                    <div className="mt-6 p-4 bg-violet-50 border border-violet-200 rounded-lg">
                      <div className="flex items-center gap-2 text-violet-800">
                        <CheckCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">
                          Affectation complète : {projects.find(p => p.id === parseInt(formData.projet_id))?.nom} • {cohortesFiltered.find(c => c.id === parseInt(formData.cohorte_id))?.nom} • {centresFiltered.find(c => c.id === parseInt(formData.centre_id))?.nom}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: FAMILLE & URGENCE */}
            {activeStep === 3 && (
              <div className="space-y-8 animate-fadeIn">

                {/* Situation Familiale */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-pink-600" />
                    </div>
                    Situation Familiale
                  </h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Situation matrimoniale
                      </label>
                      <select
                        name="situation_matrimoniale"
                        value={formData.situation_matrimoniale}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="Célibataire">Célibataire</option>
                        <option value="Mariée">Mariée</option>
                        <option value="Veuve">Veuve</option>
                        <option value="Divorcée">Divorcée</option>
                        <option value="En couple">En couple</option>
                      </select>
                    </div>

                    {/* Enfants */}
                    <div className="bg-pink-50 p-5 rounded-lg border border-pink-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="a_des_enfants"
                          checked={formData.a_des_enfants}
                          onChange={(e) => {
                            handleChange(e)
                            setShowChildForm(e.target.checked)
                          }}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900">
                          Cette candidate a des enfants
                        </span>
                      </label>

                      {showChildForm && (
                        <div className="mt-5 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre d'enfants
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={formData.nombre_enfants}
                                onChange={handleNombreEnfantsChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                              />
                            </div>

                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={childrenWithCandidate}
                                  onChange={(e) => setChildrenWithCandidate(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                  Sera accompagnée d'enfant(s)
                                </span>
                              </label>
                            </div>
                          </div>

                          {childrenWithCandidate && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-gray-700">
                                  Détails des enfants qui l'accompagnent ({formData.enfants.length})
                                </p>
                                <button
                                  type="button"
                                  onClick={addEnfant}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  Ajouter
                                </button>
                              </div>

                              {formData.enfants.map((enfant, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-700">
                                      Enfant {index + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeEnfant(index)}
                                      className="text-red-600 hover:text-red-800 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                    <input
                                      type="text"
                                      value={enfant.prenom}
                                      onChange={(e) => updateEnfant(index, 'prenom', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                      placeholder="Prénom"
                                    />
                                    <input
                                      type="date"
                                      value={enfant.date_naissance?.split('T')[0] || ''}
                                      onChange={(e) => updateEnfant(index, 'date_naissance', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <select
                                      value={enfant.sexe}
                                      onChange={(e) => updateEnfant(index, 'sexe', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                      <option value="M">Garçon</option>
                                      <option value="F">Fille</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={enfant.au_centre || false}
                                        onChange={(e) => updateEnfant(index, 'au_centre', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">Accompagne la candidate au centre</span>
                                    </div>
                                    {enfant.age_detailed && (
                                      <p className="text-xs text-gray-500">
                                        Âge: {enfant.age_detailed.years > 0 && `${enfant.age_detailed.years} ans `}
                                        {enfant.age_detailed.months > 0 && `${enfant.age_detailed.months} mois `}
                                        {enfant.age_detailed.days > 0 && `${enfant.age_detailed.days} jours`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parents */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    Informations Parents
                  </h3>

                  {/* Orphan Status */}
                  <div className="mb-5 bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <label className="block text-sm font-semibold text-amber-900 mb-3">
                      La candidate est-elle orpheline?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: 'none', label: 'Non' },
                        { value: 'pere', label: 'Orpheline de père' },
                        { value: 'mere', label: 'Orpheline de mère' },
                        { value: 'both', label: 'Orpheline des deux' }
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleOrphanChange(option.value)}
                          className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${orphanStatus === option.value
                            ? 'border-amber-500 bg-amber-100 text-amber-900'
                            : 'border-amber-200 bg-white text-gray-700 hover:border-amber-300'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Père */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-gray-800">Père</h4>
                      {!formData.pere_vivant && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                          Décédé
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="pere_nom"
                        value={formData.pere_nom}
                        onChange={handleChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nom complet du père"
                      />
                      <input
                        type="text"
                        name="pere_profession"
                        value={formData.pere_profession}
                        onChange={handleChange}
                        disabled={!formData.pere_vivant}
                        className={`px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!formData.pere_vivant ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                        placeholder="Profession"
                      />
                      <input
                        type="tel"
                        name="pere_contact1"
                        value={formData.pere_contact1}
                        onChange={handleChange}
                        disabled={!formData.pere_vivant}
                        className={`px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!formData.pere_vivant ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                        placeholder="Téléphone 1"
                        maxLength="10"
                      />
                      <input
                        type="tel"
                        name="pere_contact2"
                        value={formData.pere_contact2}
                        onChange={handleChange}
                        disabled={!formData.pere_vivant}
                        className={`px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!formData.pere_vivant ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                        placeholder="Téléphone 2 (Optionnel)"
                        maxLength="10"
                      />
                    </div>
                  </div>
                  {/* Mère */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-gray-800">Mère</h4>
                      {!formData.mere_vivante && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                          Décédée
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="mere_nom"
                        value={formData.mere_nom}
                        onChange={handleChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nom complet de la mère"
                      />
                      <input
                        type="text"
                        name="mere_profession"
                        value={formData.mere_profession}
                        onChange={handleChange}
                        disabled={!formData.mere_vivante}
                        className={`px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!formData.mere_vivante ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                        placeholder="Profession"
                      />
                      <input
                        type="tel"
                        name="mere_contact1"
                        value={formData.mere_contact1}
                        onChange={handleChange}
                        disabled={!formData.mere_vivante}
                        className={`px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!formData.mere_vivante ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                        placeholder="Téléphone 1"
                        maxLength="10"
                      />
                      <input
                        type="tel"
                        name="mere_contact2"
                        value={formData.mere_contact2}
                        onChange={handleChange}
                        disabled={!formData.mere_vivante}
                        className={`px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!formData.mere_vivante ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                        placeholder="Téléphone 2 (Optionnel)"
                        maxLength="10"
                      />
                    </div>
                  </div>

                </div>

                {/* Contact d'Urgence */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    Contact d'Urgence
                  </h3>

                  <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800 mb-4 font-medium">
                      Personne à contacter en cas d'urgence
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          name="urgence_nom"
                          value={formData.urgence_nom}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nom complet du contact d'urgence"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lien/Affiliation
                        </label>
                        <select
                          name="urgence_affiliation"
                          value={formData.urgence_affiliation}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner</option>
                          {affiliations.map((aff, i) => (
                            <option key={i} value={aff}>{aff}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profession
                        </label>
                        <input
                          type="text"
                          name="urgence_profession"
                          value={formData.urgence_profession}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Profession"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone 1 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="urgence_contact1"
                          value={formData.urgence_contact1}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.urgence_contact1 ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="22334455"
                          maxLength="10"
                        />
                        {errors.urgence_contact1 && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.urgence_contact1}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone 2 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="urgence_contact2"
                          value={formData.urgence_contact2}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.urgence_contact2 ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="22334455"
                          maxLength="10"
                        />
                        {errors.urgence_contact2 && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.urgence_contact2}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Navigation Footer */}
          <div className="bg-gray-50 px-6 py-5 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={activeStep === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${activeStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Précédent</span>
              </button>

              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-gray-900">
                  Étape {activeStep + 1}
                </div>
                <div className="text-sm text-gray-500">
                  sur {steps.length}
                </div>
              </div>

              {/* Next/Submit Button */}
              {activeStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isNavigating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{isEdit ? 'Mettre à jour' : 'Enregistrer le dossier'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </form >

      </div >
    </div >
  )
}
