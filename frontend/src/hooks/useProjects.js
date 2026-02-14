/**
 * Hook pour la gestion des projets
 * Principe SOLID: Single Responsibility - Gère uniquement le chargement des projets
 */
import { useState, useEffect, useCallback } from 'react'
import { projectsAPI } from '../services/api'

/**
 * @returns {{ projects: Array, loading: boolean, error: string|null, reload: Function }}
 */
export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await projectsAPI.getAll({ limit: 100 })
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || [])
      setProjects(data)
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des projets')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return { projects, loading, error, reload: fetchProjects }
}

/**
 * Hook pour récupérer un projet spécifique avec ses zones d'intervention
 * @param {number|string|null} projectId
 * @returns {{ project: Object|null, zones: Object, loading: boolean, error: string|null }}
 */
export function useProjectDetails(projectId) {
  const [project, setProject] = useState(null)
  const [zones, setZones] = useState({
    regions: [],
    departements: [],
    sous_prefectures: [],
    localites: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) {
      setProject(null)
      setZones({
        regions: [],
        departements: [],
        sous_prefectures: [],
        localites: []
      })
      return
    }

    const fetchProject = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await projectsAPI.getById(projectId)
        const projectData = response.data
        setProject(projectData)

        // Parse les zones d'intervention
        let zonesData = projectData.zones_intervention || {}
        if (typeof zonesData === 'string') {
          try {
            zonesData = JSON.parse(zonesData)
          } catch {
            zonesData = {}
          }
        }

        setZones({
          regions: Array.isArray(zonesData.regions) ? zonesData.regions : [],
          departements: Array.isArray(zonesData.departements) ? zonesData.departements : [],
          sous_prefectures: Array.isArray(zonesData.sous_prefectures) ? zonesData.sous_prefectures : [],
          localites: Array.isArray(zonesData.localites) ? zonesData.localites : []
        })
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement du projet')
        setProject(null)
        setZones({
          regions: [],
          departements: [],
          sous_prefectures: [],
          localites: []
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  return { project, zones, loading, error }
}

export default useProjects
