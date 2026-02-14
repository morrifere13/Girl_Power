/**
 * Hook pour la gestion des centres
 * Principe SOLID: Single Responsibility - Gère uniquement le chargement des centres
 */
import { useState, useEffect, useCallback } from 'react'
import { centresAPI } from '../services/api'

/**
 * Hook pour charger tous les centres
 * @returns {{ centres: Array, loading: boolean, error: string|null, reload: Function }}
 */
export function useCentres() {
  const [centres, setCentres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCentres = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await centresAPI.getAll({ limit: 100 })
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || [])
      setCentres(data)
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des centres')
      setCentres([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCentres()
  }, [fetchCentres])

  return { centres, loading, error, reload: fetchCentres }
}

/**
 * Hook pour charger les centres liés à un projet spécifique
 * Filtre les centres en fonction des régions du projet
 * @param {number|string|null} projectId
 * @param {Array<string>} projectRegions - Régions définies dans le projet
 * @returns {{ centres: Array, loading: boolean, error: string|null }}
 */
export function useCentresByProject(projectId, projectRegions = []) {
  const [centres, setCentres] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) {
      setCentres([])
      return
    }

    const fetchCentres = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await centresAPI.getAll({ limit: 100 })
        const allCentres = Array.isArray(response.data)
          ? response.data
          : (response.data?.data || [])

        // Filtre les centres par les régions du projet si définies
        // Si "TOUTES" ou pas de filtre, retourne tous les centres
        const hasAllRegions = projectRegions.includes('TOUTES') || projectRegions.length === 0

        const filteredCentres = hasAllRegions
          ? allCentres
          : allCentres.filter(centre =>
              !centre.region || projectRegions.includes(centre.region)
            )

        setCentres(filteredCentres)
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des centres')
        setCentres([])
      } finally {
        setLoading(false)
      }
    }

    fetchCentres()
  }, [projectId, JSON.stringify(projectRegions)])

  return { centres, loading, error }
}

export default useCentres
