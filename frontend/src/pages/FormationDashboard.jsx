import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formationsAPI, projectsAPI, cohortesAPI, centresAPI, candidatesAPI } from '../services/api'
import {
  Search, BookOpen, Users, UserX, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, RefreshCw, FolderOpen,
  Building2, GraduationCap, Eye, LogOut, Award,
  Calendar, FileText, X, AlertTriangle, MapPin,
  Clock, TrendingUp, Download, UsersRound, Timer
} from 'lucide-react'

const MOTIFS_ABANDON = [
  { id: 'personnel', label: 'Raisons personnelles / familiales' },
  { id: 'sante', label: 'Problèmes de santé' },
  { id: 'grossesse', label: 'Grossesse' },
  { id: 'financier', label: 'Difficultés financières' },
  { id: 'demenagement', label: 'Déménagement / éloignement' },
  { id: 'emploi', label: 'Emploi trouvé' },
  { id: 'motivation', label: 'Manque de motivation' },
  { id: 'apprentissage', label: 'Difficultés d\'apprentissage' },
  { id: 'discipline', label: 'Problèmes disciplinaires' },
  { id: 'autre', label: 'Autre motif' }
]

export default function FormationDashboard() {
  const navigate = useNavigate()
  const [formations, setFormations] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0, en_formation: 0, abandons: 0, termines: 0,
    projets_actifs: 0, cohortes_actives: 0, centres_actifs: 0,
    abandons_par_motif: [], duree_moyenne: 0, alertes_depassement: 0
  })
  const [filters, setFilters] = useState({ search: '', statut: '', projet_id: '', cohorte_id: '', centre_id: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 })

  const [projects, setProjects] = useState([])
  const [cohortes, setCohortes] = useState([])
  const [centres, setCentres] = useState([])

  const [abandonModal, setAbandonModal] = useState({
    isOpen: false, formation: null,
    date_abandon: new Date().toISOString().split('T')[0],
    motif_abandon: '', details_abandon: '', circonstances_abandon: '', signale_par: ''
  })

  const [terminerModal, setTerminerModal] = useState({ isOpen: false, formation: null })

  const [inscrireModal, setInscrireModal] = useState({
    isOpen: false, candidates: [], selectedCandidate: null,
    date_debut: new Date().toISOString().split('T')[0], searchQuery: '', loading: false
  })

  const [bulkModal, setBulkModal] = useState({
    isOpen: false, cohorte_id: '', date_debut: new Date().toISOString().split('T')[0], loading: false
  })

  useEffect(() => { setPagination(p => ({ ...p, page: 1 })) }, [filters])
  useEffect(() => { fetchFormations() }, [filters, pagination.page])
  useEffect(() => { fetchStats(); fetchProjects(); fetchCohortes(); fetchCentres() }, [])

  const fetchFormations = async () => {
    try {
      setLoading(true)
      const params = { ...filters, page: pagination.page, limit: pagination.limit }
      Object.keys(params).forEach(key => !params[key] && delete params[key])
      const response = await formationsAPI.getAll(params)
      setFormations(response.data.data || [])
      setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0 }))
    } catch (error) {
      toast.error('Erreur de chargement des formations')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await formationsAPI.getStats()
      setStats(response.data)
    } catch (error) { console.error(error) }
  }

  const fetchProjects = async () => {
    try { const r = await projectsAPI.getAll(); setProjects(r.data.data || r.data || []) } catch (e) { console.error(e) }
  }
  const fetchCohortes = async () => {
    try { const r = await cohortesAPI.getAll(); setCohortes(r.data.data || r.data || []) } catch (e) { console.error(e) }
  }
  const fetchCentres = async () => {
    try { const r = await centresAPI.getAll(); setCentres(r.data.data || r.data || []) } catch (e) { console.error(e) }
  }

  const handleAbandon = async () => {
    if (!abandonModal.motif_abandon) { toast.error('Sélectionnez un motif d\'abandon'); return }
    try {
      await formationsAPI.abandon(abandonModal.formation.id, {
        date_abandon: abandonModal.date_abandon, motif_abandon: abandonModal.motif_abandon,
        details_abandon: abandonModal.details_abandon, circonstances_abandon: abandonModal.circonstances_abandon,
        signale_par: abandonModal.signale_par
      })
      toast.success('Abandon enregistré')
      setAbandonModal({ isOpen: false, formation: null, date_abandon: new Date().toISOString().split('T')[0], motif_abandon: '', details_abandon: '', circonstances_abandon: '', signale_par: '' })
      fetchFormations(); fetchStats()
    } catch (error) { toast.error(error.response?.data?.error || 'Erreur') }
  }

  const handleTerminer = async () => {
    try {
      await formationsAPI.terminer(terminerModal.formation.id)
      toast.success('Formation terminée avec succès')
      setTerminerModal({ isOpen: false, formation: null })
      fetchFormations(); fetchStats()
    } catch (error) { toast.error(error.response?.data?.error || 'Erreur') }
  }

  const searchAptes = async (query) => {
    try {
      setInscrireModal(p => ({ ...p, loading: true, searchQuery: query }))
      const response = await candidatesAPI.getAll({ statut: 'Apte', search: query, limit: 10 })
      setInscrireModal(p => ({ ...p, candidates: response.data.data || [], loading: false }))
    } catch (error) { setInscrireModal(p => ({ ...p, loading: false })) }
  }

  const handleInscrire = async () => {
    const c = inscrireModal.selectedCandidate
    if (!c) { toast.error('Sélectionnez un candidat'); return }
    try {
      await formationsAPI.create({
        candidate_id: c.id, cohorte_id: c.cohorte_id || null,
        centre_id: c.centre_id || null, projet_id: c.projet_id || null,
        date_debut: inscrireModal.date_debut
      })
      toast.success(`${c.prenom} ${c.nom} inscrite en formation`)
      setInscrireModal({ isOpen: false, candidates: [], selectedCandidate: null, date_debut: new Date().toISOString().split('T')[0], searchQuery: '', loading: false })
      fetchFormations(); fetchStats()
    } catch (error) { toast.error(error.response?.data?.error || 'Erreur lors de l\'inscription') }
  }

  const handleBulkInscrire = async () => {
    if (!bulkModal.cohorte_id) { toast.error('Sélectionnez une cohorte'); return }
    try {
      setBulkModal(p => ({ ...p, loading: true }))
      const response = await formationsAPI.createBulk({ cohorte_id: bulkModal.cohorte_id, date_debut: bulkModal.date_debut })
      toast.success(response.data.message)
      setBulkModal({ isOpen: false, cohorte_id: '', date_debut: new Date().toISOString().split('T')[0], loading: false })
      fetchFormations(); fetchStats()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur')
      setBulkModal(p => ({ ...p, loading: false }))
    }
  }

  const handleExportCSV = () => {
    if (formations.length === 0) { toast.error('Aucune donnée à exporter'); return }
    const headers = ['Candidate', 'Cohorte', 'Centre', 'Projet', 'Métier', 'Date début', 'Date fin prévue', 'Durée (j)', 'Statut', 'Date abandon', 'Motif abandon']
    const rows = formations.map(f => [
      `${f.candidate_prenom} ${f.candidate_nom}`, f.cohorte_nom || '', f.centre_nom || '', f.projet_nom || '',
      f.metier_choisi || '', fmtDate(f.date_debut), fmtDate(f.date_fin_prevue), getDuree(f),
      f.statut, f.date_abandon ? fmtDate(f.date_abandon) : '', f.motif_abandon || ''
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `formations_${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success('Export CSV téléchargé')
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  const getStatutBadge = (statut) => {
    const styles = { 'En formation': 'bg-blue-100 text-blue-700', 'Abandonné': 'bg-red-100 text-red-700', 'Terminé': 'bg-emerald-100 text-emerald-700' }
    return styles[statut] || 'bg-gray-100 text-gray-700'
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const getDuree = (f) => {
    if (!f.date_debut) return '—'
    const start = new Date(f.date_debut)
    const end = f.date_fin_effective ? new Date(f.date_fin_effective) : f.date_abandon ? new Date(f.date_abandon) : new Date()
    return Math.round((end - start) / (1000 * 60 * 60 * 24))
  }

  const isDepassee = (f) => {
    if (f.statut !== 'En formation' || !f.date_fin_prevue) return false
    return new Date(f.date_fin_prevue) < new Date()
  }

  const tauxReussite = (stats.termines + stats.abandons) > 0 ? Math.round((stats.termines / (stats.termines + stats.abandons)) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg"><BookOpen size={20} className="text-violet-600" /></div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Suivi des Formations</h1>
              <p className="text-xs text-gray-500">Gestion des candidates en formation</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { searchAptes(''); setInscrireModal(p => ({ ...p, isOpen: true })) }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-medium">
              <GraduationCap size={14} /> Inscrire
            </button>
            <button onClick={() => setBulkModal(p => ({ ...p, isOpen: true }))} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
              <UsersRound size={14} /> Inscrire cohorte
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
              <Download size={14} /> Export
            </button>
            <button onClick={() => { fetchFormations(); fetchStats() }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
          <StatCard label="En formation" value={stats.en_formation} color="blue" active={filters.statut === 'En formation'} onClick={() => setFilters({...filters, statut: filters.statut === 'En formation' ? '' : 'En formation'})} icon={BookOpen} />
          <StatCard label="Abandons" value={stats.abandons} color="red" active={filters.statut === 'Abandonné'} onClick={() => setFilters({...filters, statut: filters.statut === 'Abandonné' ? '' : 'Abandonné'})} icon={UserX} />
          <StatCard label="Terminés" value={stats.termines} color="emerald" active={filters.statut === 'Terminé'} onClick={() => setFilters({...filters, statut: filters.statut === 'Terminé' ? '' : 'Terminé'})} icon={Award} />
          <StatCard label="Taux réussite" value={`${tauxReussite}%`} color="violet" icon={TrendingUp} />
          <StatCard label="Durée moy." value={`${stats.duree_moyenne || 0}j`} color="amber" icon={Timer} />
          <StatCard label="Projets actifs" value={stats.projets_actifs} color="slate" icon={FolderOpen} />
          {stats.alertes_depassement > 0 ? (
            <StatCard label="En retard" value={stats.alertes_depassement} color="orange" icon={AlertTriangle} />
          ) : (
            <StatCard label="Centres" value={stats.centres_actifs} color="slate" icon={Building2} />
          )}
        </div>
      </div>

      {/* Graphique abandons par motif */}
      {stats.abandons_par_motif && stats.abandons_par_motif.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" /> Répartition des abandons par motif
          </h3>
          <div className="space-y-2">
            {stats.abandons_par_motif.map((m, i) => {
              const maxCount = stats.abandons_par_motif[0]?.count || 1
              const pct = Math.round((m.count / maxCount) * 100)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-48 truncate">{m.motif}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-red-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{m.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Rechercher candidat..." value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-violet-200 focus:border-violet-400 outline-none" />
          </div>
          <select value={filters.statut} onChange={(e) => setFilters({ ...filters, statut: e.target.value })} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none">
            <option value="">Tous les statuts</option>
            <option value="En formation">En formation</option>
            <option value="Abandonné">Abandonné</option>
            <option value="Terminé">Terminé</option>
          </select>
          <select value={filters.projet_id} onChange={(e) => setFilters({ ...filters, projet_id: e.target.value })} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none">
            <option value="">Tous les projets</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <select value={filters.cohorte_id} onChange={(e) => setFilters({ ...filters, cohorte_id: e.target.value })} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none">
            <option value="">Toutes les cohortes</option>
            {cohortes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <select value={filters.centre_id} onChange={(e) => setFilters({ ...filters, centre_id: e.target.value })} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none">
            <option value="">Tous les centres</option>
            {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">Chargement...</p>
          </div>
        ) : formations.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Aucune formation trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Candidate</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Cohorte</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Centre</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Projet</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Métier</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Début</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Fin prévue</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Durée</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {formations.map((f) => {
                    const depassee = isDepassee(f)
                    return (
                      <tr key={f.id} className={`hover:bg-gray-50 transition ${depassee ? 'bg-orange-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {f.candidate_prenom?.charAt(0)}{f.candidate_nom?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{f.candidate_prenom} {f.candidate_nom}</p>
                              <p className="text-xs text-gray-500">{f.telephone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{f.cohorte_nom || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{f.centre_nom || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{f.projet_nom || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{f.metier_choisi || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(f.date_debut)}</td>
                        <td className="px-4 py-3">
                          <span className={depassee ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            {fmtDate(f.date_fin_prevue)}
                          </span>
                          {depassee && <p className="text-xs text-orange-500 flex items-center gap-0.5"><AlertTriangle size={10} /> En retard</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{getDuree(f)}j</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatutBadge(f.statut)}`}>{f.statut}</span>
                          {f.statut === 'Abandonné' && f.date_abandon && (
                            <p className="text-xs text-red-500 mt-0.5">{fmtDate(f.date_abandon)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => navigate(`/dossier/${f.candidate_id}`)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition" title="Voir dossier"><Eye size={16} /></button>
                            {f.statut === 'En formation' && (
                              <>
                                <button onClick={() => setAbandonModal({ ...abandonModal, isOpen: true, formation: f })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Marquer abandon"><LogOut size={16} /></button>
                                <button onClick={() => setTerminerModal({ isOpen: true, formation: f })} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Terminer formation"><CheckCircle size={16} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{pagination.total} résultat(s)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
                  <span className="px-3 py-1 text-xs text-gray-600">{pagination.page} / {totalPages}</span>
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === totalPages} className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Abandon */}
      {abandonModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-red-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><LogOut size={20} /></div>
                <div>
                  <h3 className="font-bold">Enregistrer un abandon</h3>
                  <p className="text-sm text-white/80">{abandonModal.formation?.candidate_prenom} {abandonModal.formation?.candidate_nom}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de l'abandon *</label>
                <input type="date" value={abandonModal.date_abandon} onChange={(e) => setAbandonModal(p => ({ ...p, date_abandon: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif de l'abandon *</label>
                <select value={abandonModal.motif_abandon} onChange={(e) => setAbandonModal(p => ({ ...p, motif_abandon: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-200 outline-none">
                  <option value="">-- Sélectionner un motif --</option>
                  {MOTIFS_ABANDON.map(m => <option key={m.id} value={m.label}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Détails / Explications</label>
                <textarea rows={3} value={abandonModal.details_abandon} onChange={(e) => setAbandonModal(p => ({ ...p, details_abandon: e.target.value }))}
                  placeholder="Décrivez les raisons en détail..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Circonstances / Faits</label>
                <textarea rows={3} value={abandonModal.circonstances_abandon} onChange={(e) => setAbandonModal(p => ({ ...p, circonstances_abandon: e.target.value }))}
                  placeholder="Décrivez les circonstances..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signalé par</label>
                <input type="text" value={abandonModal.signale_par} onChange={(e) => setAbandonModal(p => ({ ...p, signale_par: e.target.value }))}
                  placeholder="Nom de la personne" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
              </div>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <button onClick={() => setAbandonModal({ isOpen: false, formation: null, date_abandon: new Date().toISOString().split('T')[0], motif_abandon: '', details_abandon: '', circonstances_abandon: '', signale_par: '' })}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Annuler</button>
              <button onClick={handleAbandon} disabled={!abandonModal.motif_abandon}
                className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50">Confirmer l'abandon</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Terminer */}
      {terminerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><CheckCircle size={20} /></div>
                <div>
                  <h3 className="font-bold">Terminer la formation</h3>
                  <p className="text-sm text-white/80">{terminerModal.formation?.candidate_prenom} {terminerModal.formation?.candidate_nom}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
                  <p className="text-sm text-emerald-800">La candidate a terminé sa formation avec succès.</p>
                </div>
              </div>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <button onClick={() => setTerminerModal({ isOpen: false, formation: null })} className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Annuler</button>
              <button onClick={handleTerminer} className="flex-1 px-4 py-2.5 text-sm bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inscrire candidat */}
      {inscrireModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-violet-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><GraduationCap size={20} /></div>
                  <div>
                    <h3 className="font-bold">Inscrire en formation</h3>
                    <p className="text-sm text-white/80">Candidates au statut "Apte"</p>
                  </div>
                </div>
                <button onClick={() => setInscrireModal({ isOpen: false, candidates: [], selectedCandidate: null, date_debut: new Date().toISOString().split('T')[0], searchQuery: '', loading: false })} className="p-1.5 hover:bg-white/20 rounded-lg transition"><X size={16} /></button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Rechercher un candidat apte..." value={inscrireModal.searchQuery}
                  onChange={(e) => searchAptes(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none" />
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {inscrireModal.candidates.map(c => (
                  <button key={c.id} onClick={() => setInscrireModal(p => ({ ...p, selectedCandidate: c }))}
                    className={`w-full text-left p-2 rounded-lg border transition ${inscrireModal.selectedCandidate?.id === c.id ? 'border-violet-400 bg-violet-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <p className="text-sm font-medium">{c.prenom} {c.nom}</p>
                    <p className="text-xs text-gray-500">{c.cohorte_nom || 'Sans cohorte'} - {c.centre_nom || 'Sans centre'}</p>
                  </button>
                ))}
                {inscrireModal.candidates.length === 0 && !inscrireModal.loading && (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun candidat apte trouvé</p>
                )}
              </div>
              {inscrireModal.selectedCandidate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input type="date" value={inscrireModal.date_debut} onChange={(e) => setInscrireModal(p => ({ ...p, date_debut: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                </div>
              )}
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <button onClick={() => setInscrireModal({ isOpen: false, candidates: [], selectedCandidate: null, date_debut: new Date().toISOString().split('T')[0], searchQuery: '', loading: false })}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Annuler</button>
              <button onClick={handleInscrire} disabled={!inscrireModal.selectedCandidate}
                className="flex-1 px-4 py-2.5 text-sm bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition disabled:opacity-50">Inscrire</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inscription en masse */}
      {bulkModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><UsersRound size={20} /></div>
                  <div>
                    <h3 className="font-bold">Inscription en masse</h3>
                    <p className="text-sm text-white/80">Tous les "Apte" de la cohorte</p>
                  </div>
                </div>
                <button onClick={() => setBulkModal({ isOpen: false, cohorte_id: '', date_debut: new Date().toISOString().split('T')[0], loading: false })} className="p-1.5 hover:bg-white/20 rounded-lg transition"><X size={16} /></button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-800">
                Tous les candidats "Apte" de la cohorte seront inscrits en formation automatiquement.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cohorte *</label>
                <select value={bulkModal.cohorte_id} onChange={(e) => setBulkModal(p => ({ ...p, cohorte_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none">
                  <option value="">-- Sélectionner une cohorte --</option>
                  {cohortes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                <input type="date" value={bulkModal.date_debut} onChange={(e) => setBulkModal(p => ({ ...p, date_debut: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
              </div>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <button onClick={() => setBulkModal({ isOpen: false, cohorte_id: '', date_debut: new Date().toISOString().split('T')[0], loading: false })}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Annuler</button>
              <button onClick={handleBulkInscrire} disabled={!bulkModal.cohorte_id || bulkModal.loading}
                className="flex-1 px-4 py-2.5 text-sm bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
                {bulkModal.loading ? 'Inscription...' : 'Inscrire toute la cohorte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, active, onClick, icon: Icon }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', active: 'ring-blue-400' },
    red: { bg: 'bg-red-50', text: 'text-red-700', active: 'ring-red-400' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', active: 'ring-emerald-400' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', active: 'ring-violet-400' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', active: 'ring-amber-400' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', active: 'ring-slate-400' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', active: 'ring-orange-400' }
  }
  const c = colors[color]
  return (
    <button onClick={onClick} className={`p-3 rounded-xl text-left transition-all ${c.bg} ${active ? `ring-2 ${c.active}` : onClick ? 'hover:ring-1 hover:ring-gray-200' : ''} ${!onClick ? 'cursor-default' : ''}`}>
      <div className="flex items-center justify-between">
        <Icon size={16} className={c.text} />
        <span className={`text-xl font-bold ${c.text}`}>{value}</span>
      </div>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </button>
  )
}
