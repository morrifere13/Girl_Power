/**
 * Hook pour la gestion de l'affectation en cascade
 * Principe SOLID: Single Responsibility - Gère uniquement la logique Projet → Cohorte → Centre
 *
 * Flux: Projet → Cohortes (filtrées) → Centres (filtrés par cohorte)
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { projectsAPI, cohortesAPI, centresAPI } from '../services/api'

// ============================================================================
// CONSTANTES
// ============================================================================

const INITIAL_STATE = Object.freeze({
  projet_id: '',
  cohorte_id: '',
  centre_id: ''
})

const INITIAL_OPTIONS = Object.freeze({
  projects: [],
  cohortes: [],
  centres: []
})

const INITIAL_LOADING = Object.freeze({
  projects: false,
  cohortes: false,
  centres: false
})

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Normalise les données de réponse API (gère les formats variés)
 */
const normalizeApiData = (response) => {
  if (Array.isArray(response.data)) return response.data
  if (response.data?.data && Array.isArray(response.data.data)) return response.data.data
  if (response.data?.projects) return response.data.projects
  if (response.data?.cohortes) return response.data.cohortes
  if (response.data?.centres) return response.data.centres
  return []
}

/**
 * Hook pour éviter les race conditions
 */
const useLatestRequest = () => {
  const requestIdRef = useRef(0)

  return useCallback((asyncFn) => {
    const currentId = ++requestIdRef.current

    return async (...args) => {
      const result = await asyncFn(...args)
      if (currentId !== requestIdRef.current) {
        return { cancelled: true, data: null }
      }
      return { cancelled: false, data: result }
    }
  }, [])
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * @param {Object} initialValues - Valeurs initiales { projet_id, cohorte_id, centre_id }
 * @returns {Object} État et actions pour la sélection en cascade
 */
export function useCascadeAffectation(initialValues = INITIAL_STATE) {
  const [selections, setSelections] = useState({
    projet_id: initialValues.projet_id || '',
    cohorte_id: initialValues.cohorte_id || '',
    centre_id: initialValues.centre_id || ''
  })

  const [options, setOptions] = useState(INITIAL_OPTIONS)
  const [loading, setLoading] = useState(INITIAL_LOADING)
  const [error, setError] = useState(null)

  const createCohorteRequest = useLatestRequest()
  const createCentreRequest = useLatestRequest()

  // ============================================================================
  // CHARGEMENT DES PROJETS (Niveau 1 - une seule fois)
  // ============================================================================

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(prev => ({ ...prev, projects: true }))
      setError(null)

      try {
        const response = await projectsAPI.getAll({ limit: 100 })
        const data = normalizeApiData(response)
        setOptions(prev => ({ ...prev, projects: data }))
      } catch (err) {
        console.error('Erreur chargement projets:', err)
        setError('Erreur lors du chargement des projets')
        setOptions(prev => ({ ...prev, projects: [] }))
      } finally {
        setLoading(prev => ({ ...prev, projects: false }))
      }
    }

    loadProjects()
  }, [])

  // ============================================================================
  // CHARGEMENT DES COHORTES (Niveau 2 - dépend du projet)
  // ============================================================================

  useEffect(() => {
    if (!selections.projet_id) {
      setOptions(prev => ({ ...prev, cohortes: [], centres: [] }))
      return
    }

    const loadCohortes = async () => {
      setLoading(prev => ({ ...prev, cohortes: true }))

      const fetchWithCancel = createCohorteRequest(async () => {
        const response = await cohortesAPI.getAll({
          projet_id: selections.projet_id,
          limit: 100
        })
        return normalizeApiData(response)
      })

      try {
        const { cancelled, data } = await fetchWithCancel()
        if (cancelled) return

        setOptions(prev => ({ ...prev, cohortes: data, centres: [] }))
      } catch (err) {
        console.error('Erreur chargement cohortes:', err)
        setOptions(prev => ({ ...prev, cohortes: [], centres: [] }))
      } finally {
        setLoading(prev => ({ ...prev, cohortes: false }))
      }
    }

    loadCohortes()
  }, [selections.projet_id, createCohorteRequest])

  // ============================================================================
  // CHARGEMENT DES CENTRES (Niveau 3 - dépend de la cohorte)
  // ============================================================================

  useEffect(() => {
    if (!selections.cohorte_id) {
      setOptions(prev => ({ ...prev, centres: [] }))
      return
    }

    const loadCentres = async () => {
      setLoading(prev => ({ ...prev, centres: true }))

      const fetchWithCancel = createCentreRequest(async () => {
        // Récupère la cohorte pour obtenir ses centres liés
        const cohorteResponse = await cohortesAPI.getById(selections.cohorte_id)
        const cohorte = cohorteResponse.data

        // La cohorte contient la liste des centres liés
        return cohorte.centres || []
      })

      try {
        const { cancelled, data } = await fetchWithCancel()
        if (cancelled) return

        setOptions(prev => ({ ...prev, centres: data }))
      } catch (err) {
        console.error('Erreur chargement centres:', err)
        setOptions(prev => ({ ...prev, centres: [] }))
      } finally {
        setLoading(prev => ({ ...prev, centres: false }))
      }
    }

    loadCentres()
  }, [selections.cohorte_id, createCentreRequest])

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Change la sélection d'un niveau et réinitialise les niveaux inférieurs
   */
  const handleChange = useCallback((field, value) => {
    setSelections(prev => {
      const newState = { ...prev, [field]: value }

      // Cascade: réinitialise les niveaux inférieurs
      if (field === 'projet_id') {
        newState.cohorte_id = ''
        newState.centre_id = ''
      } else if (field === 'cohorte_id') {
        newState.centre_id = ''
      }

      return newState
    })
  }, [])

  /**
   * Définit toutes les sélections (pour le mode édition)
   */
  const setAllSelections = useCallback((values) => {
    if (!values || typeof values !== 'object') return

    setSelections({
      projet_id: values.projet_id || '',
      cohorte_id: values.cohorte_id || '',
      centre_id: values.centre_id || ''
    })
  }, [])

  /**
   * Réinitialise toutes les sélections
   */
  const resetSelections = useCallback(() => {
    setSelections(INITIAL_STATE)
  }, [])

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Récupère le nom du projet sélectionné
   */
  const selectedProjectName = useMemo(() => {
    const project = options.projects.find(p => String(p.id) === String(selections.projet_id))
    return project?.nom || ''
  }, [options.projects, selections.projet_id])

  /**
   * Récupère le nom de la cohorte sélectionnée
   */
  const selectedCohorteName = useMemo(() => {
    const cohorte = options.cohortes.find(c => String(c.id) === String(selections.cohorte_id))
    return cohorte?.nom || ''
  }, [options.cohortes, selections.cohorte_id])

  /**
   * Récupère le nom du centre sélectionné
   */
  const selectedCentreName = useMemo(() => {
    const centre = options.centres.find(c => String(c.id) === String(selections.centre_id))
    return centre?.nom || ''
  }, [options.centres, selections.centre_id])

  /**
   * Vérifie si tous les champs sont remplis
   */
  const isComplete = useMemo(() => {
    return Boolean(selections.projet_id && selections.cohorte_id && selections.centre_id)
  }, [selections])

  /**
   * Vérifie si au moins un chargement est en cours
   */
  const isLoading = useMemo(() => {
    return loading.projects || loading.cohortes || loading.centres
  }, [loading])

  // ============================================================================
  // RETOUR
  // ============================================================================

  return useMemo(() => ({
    // État
    selections,
    options,
    loading,
    error,

    // Actions
    handleChange,
    setAllSelections,
    resetSelections,

    // Helpers
    selectedProjectName,
    selectedCohorteName,
    selectedCentreName,
    isComplete,
    isLoading
  }), [
    selections,
    options,
    loading,
    error,
    handleChange,
    setAllSelections,
    resetSelections,
    selectedProjectName,
    selectedCohorteName,
    selectedCentreName,
    isComplete,
    isLoading
  ])
}

export default useCascadeAffectation
