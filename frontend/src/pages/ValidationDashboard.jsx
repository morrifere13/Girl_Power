import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { candidatesAPI, cohortesAPI, projectsAPI } from '../services/api'
import {
  Search, Eye, CheckCircle, XCircle, Clock,
  Users, Phone, ChevronRight, ChevronLeft,
  Briefcase, GraduationCap, Building2, FolderOpen,
  X, RefreshCw, CheckSquare, UserCheck, UserX,
  MapPin, Baby, Shield, FileText, AlertTriangle,
  Calendar, CreditCard, Heart, RotateCcw
} from 'lucide-react'

// Motifs de rejet prédéfinis
const MOTIFS_REJET = [
  { id: 'age_min', label: 'Âge inférieur au minimum requis' },
  { id: 'age_max', label: 'Âge supérieur au maximum autorisé' },
  { id: 'document_manquant', label: 'Document d\'identité manquant' },
  { id: 'document_expire', label: 'Document d\'identité expiré' },
  { id: 'zone_hors', label: 'Zone géographique non couverte' },
  { id: 'criteres', label: 'Ne répond pas aux critères d\'éligibilité' },
  { id: 'dossier_incomplet', label: 'Dossier incomplet' },
  { id: 'doublon', label: 'Candidature en doublon' },
  { id: 'capacite', label: 'Capacité d\'accueil atteinte' },
  { id: 'autre', label: 'Autre motif' }
]

export default function ValidationDashboard() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [cohortes, setCohortes] = useState([])

  const [stats, setStats] = useState({ total: 0, inscrits: 0, selectionnes: 0, rejetes: 0, aptes: 0, inaptes: 0, admis: 0 })
  const [filters, setFilters] = useState({ search: '', statut: '', projet_id: '', cohorte_id: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 })
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    candidate: null,
    decision: '',
    motifs: [],
    autreMotif: '',
    isBatch: false
  })
  // Modal de réhabilitation
  const [rehabModal, setRehabModal] = useState({
    isOpen: false,
    candidate: null,
    motif: '',
    loading: false
  })

  useEffect(() => { setPagination(p => ({ ...p, page: 1 })) }, [filters])
  useEffect(() => { fetchCandidates() }, [filters, pagination.page])
  useEffect(() => { fetchStats(); fetchProjects(); fetchCohortes() }, [])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const params = { ...filters, page: pagination.page, limit: pagination.limit }
      Object.keys(params).forEach(key => !params[key] && delete params[key])
      const response = await candidatesAPI.getAll(params)
      setCandidates(response.data.data || [])
      setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0 }))
    } catch (error) {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [inscrits, selectionnes, rejetes, aptes, inaptes, admis] = await Promise.all([
        candidatesAPI.getAll({ statut: 'Inscrit', limit: 1 }),
        candidatesAPI.getAll({ statut: 'Sélectionné', limit: 1 }),
        candidatesAPI.getAll({ statut: 'Rejeté', limit: 1 }),
        candidatesAPI.getAll({ statut: 'Apte', limit: 1 }),
        candidatesAPI.getAll({ statut: 'Inapte', limit: 1 }),
        candidatesAPI.getAll({ statut: 'Admis', limit: 1 })
      ])
      const i = inscrits.data.pagination?.total || 0
      const s = selectionnes.data.pagination?.total || 0
      const r = rejetes.data.pagination?.total || 0
      const a = aptes.data.pagination?.total || 0
      const n = inaptes.data.pagination?.total || 0
      const d = admis.data.pagination?.total || 0
      setStats({
        total: i + s + r + a + n + d,
        inscrits: i,
        selectionnes: s,
        rejetes: r,
        aptes: a,
        inaptes: n,
        admis: d
      })
    } catch (error) { console.error(error) }
  }

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll()
      setProjects(response.data.data || response.data || [])
    } catch (error) { console.error(error) }
  }

  const fetchCohortes = async () => {
    try {
      const response = await cohortesAPI.getAll()
      setCohortes(response.data.data || response.data || [])
    } catch (error) { console.error(error) }
  }

  const loadCandidateDetail = async (id) => {
    try {
      setLoadingDetail(true)
      const response = await candidatesAPI.getById(id)
      setSelectedCandidate(response.data)
    } catch (error) {
      toast.error('Erreur de chargement')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleValidation = async () => {
    const isRejet = validationModal.decision === 'Rejeté'

    // Pour le rejet, vérifier qu'au moins un motif est sélectionné
    if (isRejet && validationModal.motifs.length === 0) {
      toast.error('Sélectionnez au moins un motif de rejet')
      return
    }

    // Construire le commentaire à partir des motifs sélectionnés
    let comment = ''
    if (isRejet) {
      const motifsLabels = validationModal.motifs
        .map(id => MOTIFS_REJET.find(m => m.id === id)?.label)
        .filter(Boolean)
      if (validationModal.motifs.includes('autre') && validationModal.autreMotif) {
        motifsLabels.push(validationModal.autreMotif)
      }
      comment = motifsLabels.join(', ')
    } else {
      comment = 'Dossier sélectionné - Critères remplis - En attente de visite médicale'
    }

    try {
      if (validationModal.isBatch) {
        await Promise.all(selectedIds.map(id =>
          candidatesAPI.validate(id, { decision: validationModal.decision, comment })
        ))
        toast.success(`${selectedIds.length} dossiers traités`)
        setSelectedIds([])
      } else {
        await candidatesAPI.validate(validationModal.candidate.id, {
          decision: validationModal.decision,
          comment
        })
        toast.success(isRejet ? 'Candidature rejetée' : 'Candidat sélectionné pour la visite médicale')
      }
      setValidationModal({ isOpen: false, candidate: null, decision: '', motifs: [], autreMotif: '', isBatch: false })
      setSelectedCandidate(null)
      fetchCandidates()
      fetchStats()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur')
    }
  }

  // Réhabilitation d'un candidat rejeté
  const handleRehabiliter = async () => {
    if (!rehabModal.motif || rehabModal.motif.trim().length < 5) {
      toast.error('Le motif de réhabilitation doit contenir au moins 5 caractères')
      return
    }
    try {
      setRehabModal(m => ({ ...m, loading: true }))
      await candidatesAPI.rehabiliter(rehabModal.candidate.id, { motif: rehabModal.motif.trim() })
      toast.success(`${rehabModal.candidate.prenom} ${rehabModal.candidate.nom} a été réhabilité(e)`)
      setRehabModal({ isOpen: false, candidate: null, motif: '', loading: false })
      setSelectedCandidate(null)
      fetchCandidates()
      fetchStats()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la réhabilitation')
      setRehabModal(m => ({ ...m, loading: false }))
    }
  }

  const openValidation = (candidate, decision, isBatch = false) => {
    setValidationModal({ isOpen: true, candidate, decision, motifs: [], autreMotif: '', isBatch })
  }

  const toggleMotif = (motifId) => {
    setValidationModal(prev => ({
      ...prev,
      motifs: prev.motifs.includes(motifId)
        ? prev.motifs.filter(id => id !== motifId)
        : [...prev.motifs, motifId]
    }))
  }

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  const getStatutBadge = (statut) => {
    const styles = {
      'Inscrit': 'bg-blue-100 text-blue-700',
      'Sélectionné': 'bg-amber-100 text-amber-700',
      'Rejeté': 'bg-red-100 text-red-700',
      'Apte': 'bg-emerald-100 text-emerald-700',
      'Inapte': 'bg-orange-100 text-orange-700',
      'Admis': 'bg-indigo-100 text-indigo-700'
    }
    return styles[statut] || styles['Inscrit']
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Shield size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Validation des Candidatures</h1>
              <p className="text-xs text-gray-500">Gestion des dossiers de candidature</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Compteur en attente */}
            {stats.inscrits > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                <AlertTriangle size={14} />
                {stats.inscrits} en attente de validation
              </div>
            )}
            <button onClick={() => { fetchCandidates(); fetchStats(); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              <RefreshCw size={14} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
          <StatCard label="Tous" value={stats.total} color="slate" active={filters.statut === ''} onClick={() => setFilters({...filters, statut: ''})} icon={Users} />
          <StatCard label="Inscrits" value={stats.inscrits} color="blue" active={filters.statut === 'Inscrit'} onClick={() => setFilters({...filters, statut: 'Inscrit'})} icon={Clock} />
          <StatCard label="Sélectionnés" value={stats.selectionnes} color="amber" active={filters.statut === 'Sélectionné'} onClick={() => setFilters({...filters, statut: 'Sélectionné'})} icon={UserCheck} />
          <StatCard label="Rejetés" value={stats.rejetes} color="red" active={filters.statut === 'Rejeté'} onClick={() => setFilters({...filters, statut: 'Rejeté'})} icon={UserX} />
          <StatCard label="Aptes" value={stats.aptes} color="emerald" active={filters.statut === 'Apte'} onClick={() => setFilters({...filters, statut: 'Apte'})} icon={Heart} />
          <StatCard label="Inaptes" value={stats.inaptes} color="orange" active={filters.statut === 'Inapte'} onClick={() => setFilters({...filters, statut: 'Inapte'})} icon={XCircle} />
          <StatCard label="Admis" value={stats.admis} color="indigo" active={filters.statut === 'Admis'} onClick={() => setFilters({...filters, statut: 'Admis'})} icon={GraduationCap} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-200 focus:border-primary-400 outline-none"
            />
          </div>
          <select value={filters.statut} onChange={(e) => setFilters({ ...filters, statut: e.target.value })} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-200 outline-none">
            <option value="">Tous les statuts</option>
            <option value="Inscrit">Inscrit</option>
            <option value="Sélectionné">Sélectionné</option>
            <option value="Rejeté">Rejeté</option>
            <option value="Apte">Apte</option>
            <option value="Inapte">Inapte</option>
            <option value="Admis">Admis</option>
          </select>
          <select value={filters.projet_id} onChange={(e) => setFilters({ ...filters, projet_id: e.target.value })} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-200 outline-none">
            <option value="">Tous les projets</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <select value={filters.cohorte_id} onChange={(e) => setFilters({ ...filters, cohorte_id: e.target.value })} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-200 outline-none">
            <option value="">Toutes les cohortes</option>
            {cohortes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-primary-600 rounded-xl p-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 text-sm">
            <CheckSquare size={16} />
            <span className="font-medium">{selectedIds.length} sélectionnée(s)</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openValidation(null, 'Sélectionné', true)} className="px-3 py-1.5 text-sm bg-emerald-500 rounded-lg hover:bg-emerald-600 transition font-medium flex items-center gap-1.5">
              <CheckCircle size={14} /> Sélectionner
            </button>
            <button onClick={() => openValidation(null, 'Rejeté', true)} className="px-3 py-1.5 text-sm bg-red-500 rounded-lg hover:bg-red-600 transition font-medium flex items-center gap-1.5">
              <XCircle size={14} /> Rejeter
            </button>
            <button onClick={() => setSelectedIds([])} className="p-1.5 hover:bg-white/20 rounded-lg transition">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-4">
        {/* List */}
        <div className={`transition-all ${selectedCandidate ? 'w-1/2' : 'w-full'}`}>
          {loading ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 mt-3">Chargement...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Aucune candidate</p>
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => loadCandidateDetail(candidate.id)}
                  className={`bg-white rounded-xl p-3 border transition-all cursor-pointer group ${
                    selectedCandidate?.id === candidate.id ? 'border-primary-400 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(candidate.id)}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(candidate.id); }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                    />

                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {candidate.prenom?.charAt(0)}{candidate.nom?.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition truncate">
                          {candidate.prenom} {candidate.nom}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatutBadge(candidate.statut)}`}>
                          {candidate.statut}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{candidate.age} ans</span>
                        <span>•</span>
                        <span className="truncate">{candidate.ville}</span>
                        {candidate.metier_choisi && (
                          <>
                            <span>•</span>
                            <span className="truncate">{candidate.metier_choisi}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions rapides selon le statut */}
                    {candidate.statut === 'Inscrit' && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => { e.stopPropagation(); openValidation(candidate, 'Sélectionné'); }}
                          className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
                          title="Sélectionner"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openValidation(candidate, 'Rejeté'); }}
                          className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          title="Rejeter"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}

                    {/* Bouton réhabiliter pour les rejetés */}
                    {candidate.statut === 'Rejeté' && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRehabModal({ isOpen: true, candidate, motif: '', loading: false }); }}
                          className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                          title="Réhabiliter ce candidat"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    )}

                    <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-400 transition flex-shrink-0" />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1 text-xs text-gray-600">{pagination.page} / {totalPages}</span>
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === totalPages} className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCandidate && (
          <div className="w-1/2">
            <DetailPanel
              candidate={selectedCandidate}
              loading={loadingDetail}
              onClose={() => setSelectedCandidate(null)}
              onValidate={(decision) => openValidation(selectedCandidate, decision)}
              onRehabiliter={() => setRehabModal({ isOpen: true, candidate: selectedCandidate, motif: '', loading: false })}
              onViewFull={() => navigate(`/candidates/${selectedCandidate.id}`)}
              getStatutBadge={getStatutBadge}
            />
          </div>
        )}
      </div>

      {/* Validation Modal */}
      {validationModal.isOpen && (
        <ValidationModal
          modal={validationModal}
          onClose={() => setValidationModal({ isOpen: false, candidate: null, decision: '', motifs: [], autreMotif: '', isBatch: false })}
          onConfirm={handleValidation}
          toggleMotif={toggleMotif}
          setAutreMotif={(v) => setValidationModal(m => ({ ...m, autreMotif: v }))}
          selectedCount={selectedIds.length}
        />
      )}

      {/* Modal Réhabilitation */}
      {rehabModal.isOpen && (
        <RehabilitationModal
          modal={rehabModal}
          onClose={() => setRehabModal({ isOpen: false, candidate: null, motif: '', loading: false })}
          onConfirm={handleRehabiliter}
          setMotif={(v) => setRehabModal(m => ({ ...m, motif: v }))}
        />
      )}
    </div>
  )
}

// Stat Card
function StatCard({ label, value, color, active, onClick, icon: Icon }) {
  const colors = {
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', active: 'ring-slate-400' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', active: 'ring-amber-400' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', active: 'ring-emerald-400' },
    red: { bg: 'bg-red-50', text: 'text-red-700', active: 'ring-red-400' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', active: 'ring-blue-400' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', active: 'ring-orange-400' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', active: 'ring-indigo-400' }
  }
  const c = colors[color]

  return (
    <button onClick={onClick} className={`p-3 rounded-xl text-left transition-all ${c.bg} ${active ? `ring-2 ${c.active}` : 'hover:ring-1 hover:ring-gray-200'}`}>
      <div className="flex items-center justify-between">
        <Icon size={16} className={c.text} />
        <span className={`text-xl font-bold ${c.text}`}>{value}</span>
      </div>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </button>
  )
}

// Detail Panel - enhanced with rehabilitation button
function DetailPanel({ candidate, loading, onClose, onValidate, onRehabiliter, onViewFull, getStatutBadge }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100 flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  // Calculer le temps depuis l'inscription
  const daysSinceInscription = candidate.date_inscription
    ? Math.floor((Date.now() - new Date(candidate.date_inscription).getTime()) / 86400000)
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
              {candidate.prenom?.charAt(0)}{candidate.nom?.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{candidate.prenom} {candidate.nom}</h2>
              <p className="text-xs text-gray-500">{candidate.age} ans • {candidate.situation_matrimoniale}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatutBadge(candidate.statut)}`}>
            {candidate.statut}
          </span>
          {candidate.metier_choisi && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
              {candidate.metier_choisi}
            </span>
          )}
          {/* Temps depuis inscription */}
          {daysSinceInscription !== null && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
              daysSinceInscription > 30 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <Clock size={10} />
              {daysSinceInscription}j depuis inscription
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
        <Section title="Localisation" icon={MapPin}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Info label="Région" value={candidate.region} />
            <Info label="Ville" value={candidate.ville} />
            <Info label="Quartier" value={candidate.quartier} />
          </div>
        </Section>

        <Section title="Contact" icon={Phone}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Info label="Téléphone" value={candidate.telephone} />
            <Info label="Téléphone 2" value={candidate.telephone_2} />
            <Info label="Email" value={candidate.email} />
          </div>
        </Section>

        <Section title="Documents" icon={CreditCard}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Info label="Type" value={candidate.type_document} />
            <Info label="Numéro" value={candidate.numero_document} />
            <Info label="NNI" value={candidate.nni} />
            <Info label="Validité" value={candidate.date_validite_document ? new Date(candidate.date_validite_document).toLocaleDateString('fr-FR') : '—'} />
          </div>
        </Section>

        <Section title="Formation" icon={GraduationCap}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Info label="Niveau" value={candidate.niveau_etude} />
            <Info label="Diplôme" value={candidate.diplome} />
            <Info label="Métier souhaité" value={candidate.metier_choisi} />
          </div>
        </Section>

        {(candidate.projet_nom || candidate.cohorte_nom || candidate.centre_nom) && (
          <Section title="Affectation" icon={Building2}>
            <div className="flex gap-2 text-xs">
              {candidate.projet_nom && (
                <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded font-medium">{candidate.projet_nom}</span>
              )}
              {candidate.cohorte_nom && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">{candidate.cohorte_nom}</span>
              )}
              {candidate.centre_nom && (
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">{candidate.centre_nom}</span>
              )}
            </div>
          </Section>
        )}

        <Section title="Famille" icon={Users}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Info label="Situation" value={candidate.situation_matrimoniale} />
            <Info label="Enfants" value={candidate.nombre_enfants > 0 ? `${candidate.nombre_enfants} (${candidate.nombre_enfants_charge} à charge)` : 'Aucun'} />
          </div>
          {candidate.enfants && candidate.enfants.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.enfants.map((e, i) => (
                <span key={i} className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded text-xs">
                  {e.prenom} ({e.age} ans)
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title="Urgence" icon={AlertTriangle}>
          <div className="p-2 bg-red-50 rounded-lg text-xs">
            <p className="font-semibold text-gray-900">{candidate.urgence_nom || 'Non défini'}</p>
            <p className="text-gray-600">{candidate.urgence_affiliation} • {candidate.urgence_contact1}</p>
          </div>
        </Section>
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
        <button onClick={onViewFull} className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-1.5">
          <Eye size={14} /> Dossier complet
        </button>
        {candidate.statut === 'Inscrit' && (
          <>
            <button onClick={() => onValidate('Sélectionné')} className="px-4 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold flex items-center gap-1.5">
              <CheckCircle size={14} /> Sélectionner
            </button>
            <button onClick={() => onValidate('Rejeté')} className="px-4 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-1.5">
              <XCircle size={14} /> Rejeter
            </button>
          </>
        )}
        {candidate.statut === 'Rejeté' && (
          <button onClick={onRehabiliter} className="px-4 py-2 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold flex items-center gap-1.5">
            <RotateCcw size={14} /> Réhabiliter
          </button>
        )}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        <Icon size={12} className="text-gray-400" /> {title}
      </h4>
      {children}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

// Validation Modal
function ValidationModal({ modal, onClose, onConfirm, toggleMotif, setAutreMotif, selectedCount }) {
  const isRejet = modal.decision === 'Rejeté'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`p-4 text-white ${isRejet ? 'bg-red-600' : 'bg-emerald-600'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              {isRejet ? <XCircle size={20} /> : <CheckCircle size={20} />}
            </div>
            <div>
              <h3 className="font-bold">
                {isRejet ? 'Rejeter' : 'Sélectionner'} {modal.isBatch ? `${selectedCount} candidatures` : 'la candidature'}
              </h3>
              {!modal.isBatch && modal.candidate && (
                <p className="text-sm text-white/80">{modal.candidate.prenom} {modal.candidate.nom}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isRejet ? (
            <>
              <p className="text-sm font-medium text-gray-700 mb-3">Sélectionnez le(s) motif(s) de rejet :</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {MOTIFS_REJET.map((motif) => (
                  <label
                    key={motif.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      modal.motifs.includes(motif.id)
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={modal.motifs.includes(motif.id)}
                      onChange={() => toggleMotif(motif.id)}
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-400"
                    />
                    <span className="text-sm text-gray-700">{motif.label}</span>
                  </label>
                ))}
              </div>
              {modal.motifs.includes('autre') && (
                <input
                  type="text"
                  placeholder="Précisez le motif..."
                  value={modal.autreMotif}
                  onChange={(e) => setAutreMotif(e.target.value)}
                  className="w-full mt-3 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-200 focus:border-red-400 outline-none"
                />
              )}
            </>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Sélection pour visite médicale</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    {modal.isBatch
                      ? `Les ${selectedCount} candidates seront convoquées pour la visite médicale.`
                      : 'La candidate sera convoquée pour la visite médicale.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isRejet && modal.motifs.length === 0}
            className={`flex-1 px-4 py-2.5 text-sm text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isRejet ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal de Réhabilitation
function RehabilitationModal({ modal, onClose, onConfirm, setMotif }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 text-white bg-amber-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="font-bold">Réhabiliter la candidature</h3>
              {modal.candidate && (
                <p className="text-sm text-white/80">{modal.candidate.prenom} {modal.candidate.nom}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Cette action remettra le statut à "Inscrit"</p>
                <p className="text-xs text-amber-700 mt-1">
                  La candidate pourra de nouveau être sélectionnée ou rejetée lors du processus de validation.
                </p>
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motif de réhabilitation <span className="text-red-500">*</span>
          </label>
          <textarea
            value={modal.motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Expliquez pourquoi cette candidature doit être réhabilitée (min. 5 caractères)..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{modal.motif.length}/5 caractères minimum</p>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={modal.motif.trim().length < 5 || modal.loading}
            className="flex-1 px-4 py-2.5 text-sm text-white font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {modal.loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <RotateCcw size={14} />
            )}
            Réhabiliter
          </button>
        </div>
      </div>
    </div>
  )
}
