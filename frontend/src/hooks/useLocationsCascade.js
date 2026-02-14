/**
 * Hook pour la gestion du filtrage en cascade des localisations
 * Principe SOLID: Single Responsibility - Gère uniquement la logique de cascade géographique
 *
 * Flux: Projet -> Régions -> Départements -> Sous-préfectures -> Localités
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { locationsAPI } from '../services/api'

// ============================================================================
// CONSTANTES
// ============================================================================

const EMPTY_LOCATIONS = Object.freeze({
  regions: [],
  departements: [],
  sousPrefectures: [],
  localites: []
})

const EMPTY_SELECTIONS = Object.freeze({
  regions: [],
  departements: [],
  sousPrefectures: [],
  localites: []
})

const INITIAL_LOADING_STATES = Object.freeze({
  regions: false,
  departements: false,
  sousPrefectures: false,
  localites: false
})

const RESET_LEVELS_MAP = Object.freeze({
  regions: { departements: [], sousPrefectures: [], localites: [] },
  departements: { sousPrefectures: [], localites: [] },
  sousPrefectures: { localites: [] },
  localites: {}
})

/**
 * AMÉLIORATION 3: Mapping centralisé pour convertir les clés API (snake_case)
 * vers les clés internes (camelCase)
 */
const API_TO_INTERNAL_KEY = Object.freeze({
  regions: 'regions',
  departements: 'departements',
  sous_prefectures: 'sousPrefectures',
  localites: 'localites'
})

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Charge les données en parallèle et fusionne les résultats
 */
const fetchAndMergeLocations = async (parentValues, fetchFn, filterBy = []) => {
  if (parentValues.length === 0) return []

  const responses = await Promise.all(
    parentValues.map(parent => fetchFn(parent).catch(() => ({ data: [] })))
  )

  const allItems = responses.flatMap(res => res.data || [])
  const filtered = filterBy.length > 0
    ? allItems.filter(item => filterBy.includes(item))
    : allItems

  return [...new Set(filtered)]
}

/**
 * AMÉLIORATION 2: Optimisé - stocke la version stringifiée pour éviter double calcul
 */
const useStableArray = (array) => {
  const arrayRef = useRef(array)
  const stringRef = useRef(JSON.stringify(array))

  const currentString = JSON.stringify(array)

  // Compare les strings (une seule fois) au lieu de stringifier deux fois
  if (stringRef.current !== currentString) {
    arrayRef.current = array
    stringRef.current = currentString
  }

  return arrayRef.current
}

/**
 * AMÉLIORATION 1: Hook pour gérer les requêtes avec annulation des anciennes
 * Retourne une fonction qui ignore les résultats obsolètes
 */
const useLatestRequest = () => {
  const requestIdRef = useRef(0)

  const createRequest = useCallback((asyncFn) => {
    const currentId = ++requestIdRef.current

    return async (...args) => {
      const result = await asyncFn(...args)
      // Vérifie si c'est toujours la requête la plus récente
      if (currentId !== requestIdRef.current) {
        return { cancelled: true, data: null }
      }
      return { cancelled: false, data: result }
    }
  }, [])

  return createRequest
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useLocationsCascade(projectZones = EMPTY_SELECTIONS) {
  const [availableLocations, setAvailableLocations] = useState(EMPTY_LOCATIONS)
  const [selectedZones, setSelectedZones] = useState(EMPTY_SELECTIONS)
  const [loadingStates, setLoadingStates] = useState(INITIAL_LOADING_STATES)

  const projectZonesRef = useRef(projectZones)

  // AMÉLIORATION 1: Gestionnaires de requêtes pour chaque niveau
  const createDeptRequest = useLatestRequest()
  const createSPRequest = useLatestRequest()
  const createLocRequest = useLatestRequest()

  // AMÉLIORATION 2: Dépendances stables optimisées
  const stableSelectedRegions = useStableArray(selectedZones.regions)
  const stableSelectedDepts = useStableArray(selectedZones.departements)
  const stableSelectedSPs = useStableArray(selectedZones.sousPrefectures)
  const stableProjectRegions = useStableArray(projectZones.regions || [])

  useEffect(() => {
    projectZonesRef.current = projectZones
  }, [projectZones])

  // ============================================================================
  // CHARGEMENT DES RÉGIONS (Niveau 1)
  // ============================================================================

  useEffect(() => {
    const loadRegions = async () => {
      const zones = projectZonesRef.current

      if (!zones.regions || zones.regions.length === 0) {
        setAvailableLocations(EMPTY_LOCATIONS)
        setSelectedZones(EMPTY_SELECTIONS)
        return
      }

      if (zones.regions.includes('TOUTES')) {
        setLoadingStates(prev => ({ ...prev, regions: true }))
        try {
          const response = await locationsAPI.getRegions()
          setAvailableLocations(prev => ({ ...prev, regions: response.data || [] }))
        } catch (error) {
          console.error('Erreur chargement régions:', error)
          setAvailableLocations(prev => ({ ...prev, regions: [] }))
        } finally {
          setLoadingStates(prev => ({ ...prev, regions: false }))
        }
      } else {
        setAvailableLocations(prev => ({ ...prev, regions: zones.regions }))
      }

      setSelectedZones(EMPTY_SELECTIONS)
    }

    loadRegions()
  }, [stableProjectRegions])

  // ============================================================================
  // CHARGEMENT DES DÉPARTEMENTS (Niveau 2) - AMÉLIORATION 1: Avec annulation
  // ============================================================================

  useEffect(() => {
    if (stableSelectedRegions.length === 0) {
      setAvailableLocations(prev => ({
        ...prev,
        departements: [],
        sousPrefectures: [],
        localites: []
      }))
      return
    }

    const loadDepartements = async () => {
      setLoadingStates(prev => ({ ...prev, departements: true }))

      // Crée une requête annulable
      const fetchWithCancel = createDeptRequest(async () => {
        const zones = projectZonesRef.current
        return fetchAndMergeLocations(
          stableSelectedRegions,
          locationsAPI.getDepartements,
          zones.departements || []
        )
      })

      try {
        const { cancelled, data } = await fetchWithCancel()

        // Ignore si la requête a été annulée par une plus récente
        if (cancelled) return

        setAvailableLocations(prev => ({
          ...prev,
          departements: data,
          sousPrefectures: [],
          localites: []
        }))
      } catch (error) {
        console.error('Erreur chargement départements:', error)
        setAvailableLocations(prev => ({
          ...prev,
          departements: [],
          sousPrefectures: [],
          localites: []
        }))
      } finally {
        setLoadingStates(prev => ({ ...prev, departements: false }))
      }
    }

    loadDepartements()
  }, [stableSelectedRegions, createDeptRequest])

  // ============================================================================
  // CHARGEMENT DES SOUS-PRÉFECTURES (Niveau 3)
  // ============================================================================

  useEffect(() => {
    if (stableSelectedDepts.length === 0) {
      setAvailableLocations(prev => ({ ...prev, sousPrefectures: [], localites: [] }))
      return
    }

    const loadSousPrefectures = async () => {
      setLoadingStates(prev => ({ ...prev, sousPrefectures: true }))

      const fetchWithCancel = createSPRequest(async () => {
        const zones = projectZonesRef.current
        // AMÉLIORATION 3: Utilise le mapping pour accéder à la clé API
        const filterKey = zones.sous_prefectures || zones.sousPrefectures || []
        return fetchAndMergeLocations(
          stableSelectedDepts,
          locationsAPI.getSousPrefectures,
          filterKey
        )
      })

      try {
        const { cancelled, data } = await fetchWithCancel()
        if (cancelled) return

        setAvailableLocations(prev => ({
          ...prev,
          sousPrefectures: data,
          localites: []
        }))
      } catch (error) {
        console.error('Erreur chargement sous-préfectures:', error)
        setAvailableLocations(prev => ({ ...prev, sousPrefectures: [], localites: [] }))
      } finally {
        setLoadingStates(prev => ({ ...prev, sousPrefectures: false }))
      }
    }

    loadSousPrefectures()
  }, [stableSelectedDepts, createSPRequest])

  // ============================================================================
  // CHARGEMENT DES LOCALITÉS (Niveau 4)
  // ============================================================================

  useEffect(() => {
    if (stableSelectedSPs.length === 0) {
      setAvailableLocations(prev => ({ ...prev, localites: [] }))
      return
    }

    const loadLocalites = async () => {
      setLoadingStates(prev => ({ ...prev, localites: true }))

      const fetchWithCancel = createLocRequest(async () => {
        const zones = projectZonesRef.current
        return fetchAndMergeLocations(
          stableSelectedSPs,
          locationsAPI.getLocalites,
          zones.localites || []
        )
      })

      try {
        const { cancelled, data } = await fetchWithCancel()
        if (cancelled) return

        setAvailableLocations(prev => ({ ...prev, localites: data }))
      } catch (error) {
        console.error('Erreur chargement localités:', error)
        setAvailableLocations(prev => ({ ...prev, localites: [] }))
      } finally {
        setLoadingStates(prev => ({ ...prev, localites: false }))
      }
    }

    loadLocalites()
  }, [stableSelectedSPs, createLocRequest])

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const toggleSelection = useCallback((type, value) => {
    // AMÉLIORATION 3: Normalise la clé si elle vient de l'extérieur en snake_case
    const normalizedType = API_TO_INTERNAL_KEY[type] || type

    setSelectedZones(prev => {
      const current = prev[normalizedType] || []
      const isCurrentlySelected = current.includes(value)

      return {
        ...prev,
        [normalizedType]: isCurrentlySelected
          ? current.filter(v => v !== value)
          : [...current, value],
        ...RESET_LEVELS_MAP[normalizedType]
      }
    })
  }, [])

  const selectAll = useCallback((type) => {
    const normalizedType = API_TO_INTERNAL_KEY[type] || type

    setSelectedZones(prev => ({
      ...prev,
      [normalizedType]: [...(availableLocations[normalizedType] || [])],
      ...RESET_LEVELS_MAP[normalizedType]
    }))
  }, [availableLocations])

  const deselectAll = useCallback((type) => {
    const normalizedType = API_TO_INTERNAL_KEY[type] || type

    setSelectedZones(prev => ({
      ...prev,
      [normalizedType]: [],
      ...RESET_LEVELS_MAP[normalizedType]
    }))
  }, [])

  const isSelected = useCallback((type, value) => {
    const normalizedType = API_TO_INTERNAL_KEY[type] || type
    return (selectedZones[normalizedType] || []).includes(value)
  }, [selectedZones])

  const isAllSelected = useCallback((type) => {
    const normalizedType = API_TO_INTERNAL_KEY[type] || type
    const allValues = availableLocations[normalizedType] || []
    const selected = selectedZones[normalizedType] || []
    return allValues.length > 0 && selected.length === allValues.length
  }, [availableLocations, selectedZones])

  const resetSelections = useCallback(() => {
    setSelectedZones(EMPTY_SELECTIONS)
  }, [])

  /**
   * Définit les sélections (pour le mode édition)
   * Accepte les deux formats de clés (snake_case et camelCase)
   */
  const setSelections = useCallback((zones) => {
    if (!zones || typeof zones !== 'object') return

    setSelectedZones({
      regions: Array.isArray(zones.regions) ? zones.regions : [],
      departements: Array.isArray(zones.departements) ? zones.departements : [],
      // Accepte les deux formats pour la rétrocompatibilité
      sousPrefectures: Array.isArray(zones.sousPrefectures)
        ? zones.sousPrefectures
        : (Array.isArray(zones.sous_prefectures) ? zones.sous_prefectures : []),
      localites: Array.isArray(zones.localites) ? zones.localites : []
    })
  }, [])

  // ============================================================================
  // RETOUR
  // ============================================================================

  return useMemo(() => ({
    availableLocations,
    selectedZones,
    loadingStates,
    toggleSelection,
    selectAll,
    deselectAll,
    resetSelections,
    setSelections,
    isSelected,
    isAllSelected
  }), [
    availableLocations,
    selectedZones,
    loadingStates,
    toggleSelection,
    selectAll,
    deselectAll,
    resetSelections,
    setSelections,
    isSelected,
    isAllSelected
  ])
}

export default useLocationsCascade
