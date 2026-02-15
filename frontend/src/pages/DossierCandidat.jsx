import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formationsAPI } from '../services/api'
import { API_BASE_URL } from '../services/api'
import {
  ArrowLeft, User, FileText, Shield, Stethoscope,
  BookOpen, Briefcase, MapPin, Phone, Mail,
  Calendar, ChevronDown, ChevronUp, CheckCircle,
  XCircle, AlertTriangle, Clock, Award, LogOut,
  GraduationCap, Building2, FolderOpen, Heart,
  Download, Printer, ExternalLink, BarChart3
} from 'lucide-react'

export default function DossierCandidat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef()
  const [openSections, setOpenSections] = useState({
    inscription: true,
    validation: true,
    visite: true,
    formation: true,
    stages: true
  })

  useEffect(() => {
    fetchDossier()
  }, [id])

  const fetchDossier = async () => {
    try {
      setLoading(true)
      const response = await formationsAPI.getDossier(id)
      setDossier(response.data)
    } catch (error) {
      toast.error('Erreur de chargement du dossier')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  // Export PDF via impression navigateur
  const handleExportPDF = () => {
    const content = printRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Dossier - ${dossier?.candidate?.prenom} ${dossier?.candidate?.nom}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; font-size: 12px; }
            h1 { color: #1B3A5C; font-size: 18px; border-bottom: 2px solid #1B3A5C; padding-bottom: 8px; }
            h2 { color: #1B3A5C; font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
            .field label { color: #666; font-size: 11px; display: block; }
            .field value { font-weight: bold; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .badge-green { background: #d1fae5; color: #065f46; }
            .badge-red { background: #fee2e2; color: #991b1b; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            .section { margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .timeline { display: flex; align-items: center; justify-content: space-between; margin: 16px 0; }
            .step { text-align: center; flex: 1; }
            .step-dot { width: 24px; height: 24px; border-radius: 50%; margin: 0 auto 4px; }
            .step-dot.active { background: #10b981; }
            .step-dot.inactive { background: #d1d5db; }
            .step-dot.error { background: #ef4444; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${generatePrintHTML()}
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 300)
  }

  const generatePrintHTML = () => {
    if (!dossier || !dossier.candidate) return ''
    const c = dossier.candidate
    const v = dossier.visites_medicales?.[0]
    const f = dossier.formations?.[0]
    const s = dossier.stages || []
    const vl = dossier.validation_logs || []

    return `
      <h1>DOSSIER CANDIDAT - ${c.prenom} ${c.nom?.toUpperCase()}</h1>
      <p><strong>Statut:</strong> ${c.statut} | <strong>Date d'impression:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>

      <h2>1. Inscription</h2>
      <div class="grid">
        <div class="field"><label>Nom complet</label> ${c.prenom} ${c.nom}</div>
        <div class="field"><label>Date de naissance</label> ${fmtDate(c.date_naissance)} (${c.age} ans)</div>
        <div class="field"><label>Sexe</label> ${c.sexe === 'F' ? 'Féminin' : 'Masculin'}</div>
        <div class="field"><label>Situation</label> ${c.situation_matrimoniale || '—'}</div>
        <div class="field"><label>Document</label> ${c.type_document || '—'} - ${c.numero_document || '—'}</div>
        <div class="field"><label>Localisation</label> ${c.region || '—'} / ${c.ville || '—'}</div>
        <div class="field"><label>Téléphone</label> ${c.telephone || '—'}</div>
        <div class="field"><label>Métier</label> ${c.metier_choisi || '—'}</div>
        <div class="field"><label>Niveau</label> ${c.niveau_etude || '—'}</div>
        <div class="field"><label>Projet</label> ${c.projet_nom || '—'}</div>
        <div class="field"><label>Cohorte</label> ${c.cohorte_nom || '—'}</div>
        <div class="field"><label>Centre</label> ${c.centre_nom || '—'}</div>
      </div>

      <h2>2. Validation</h2>
      ${vl.length > 0 ? vl.map(l => `<div class="section"><strong>${l.action}</strong> - ${fmtDate(l.created_at)}${l.details ? `<br/><em>${typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}</em>` : ''}</div>`).join('') : '<p>Aucun log de validation</p>'}

      <h2>3. Visite Médicale</h2>
      ${v ? `
        <div class="grid">
          <div class="field"><label>Date</label> ${fmtDate(v.date_visite)}</div>
          <div class="field"><label>Médecin</label> ${v.medecin_nom ? 'Dr. ' + v.medecin_nom : '—'}</div>
          <div class="field"><label>Établissement</label> ${v.etablissement || '—'}</div>
          <div class="field"><label>Résultat</label> <span class="badge ${v.apte_physiquement ? 'badge-green' : 'badge-red'}">${v.apte_physiquement ? 'APTE' : 'INAPTE'}</span></div>
          <div class="field"><label>Test grossesse</label> ${v.test_grossesse || 'N/A'}</div>
        </div>
        ${v.observations ? `<div class="section"><strong>Observations:</strong> ${v.observations}</div>` : ''}
      ` : '<p>Aucune visite médicale</p>'}

      <h2>4. Formation</h2>
      ${f ? `
        <div class="grid">
          <div class="field"><label>Début</label> ${fmtDate(f.date_debut)}</div>
          <div class="field"><label>Fin prévue</label> ${fmtDate(f.date_fin_prevue)}</div>
          <div class="field"><label>Statut</label> <span class="badge ${f.statut === 'Abandonné' ? 'badge-red' : f.statut === 'Terminé' ? 'badge-green' : 'badge-blue'}">${f.statut}</span></div>
        </div>
        ${f.statut === 'Abandonné' ? `<div class="section"><strong>Motif abandon:</strong> ${f.motif_abandon || '—'}<br/>${f.details_abandon || ''}</div>` : ''}
      ` : '<p>Aucune formation</p>'}

      <h2>5. Stages</h2>
      ${s.length > 0 ? s.map(st => `
        <div class="section">
          <strong>${st.entreprise_nom || 'Entreprise inconnue'}</strong> - ${st.statut}<br/>
          ${fmtDate(st.date_debut)} → ${fmtDate(st.date_fin)}<br/>
          Métier: ${st.metier_stage || '—'} | Tuteur: ${st.tuteur_nom || '—'}
        </div>
      `).join('') : '<p>Aucun stage</p>'}
    `
  }

  // Calcul complétude du dossier
  const getCompletude = () => {
    if (!dossier || !dossier.candidate) return { percent: 0, items: [] }
    const c = dossier.candidate
    const items = []

    // Informations personnelles
    if (c.nom && c.prenom) items.push({ label: 'Identité', ok: true })
    else items.push({ label: 'Identité', ok: false })

    if (c.telephone) items.push({ label: 'Téléphone', ok: true })
    else items.push({ label: 'Téléphone', ok: false })

    if (c.type_document && c.numero_document) items.push({ label: 'Document identité', ok: true })
    else items.push({ label: 'Document identité', ok: false })

    if (c.region && c.ville) items.push({ label: 'Localisation', ok: true })
    else items.push({ label: 'Localisation', ok: false })

    if (c.metier_choisi) items.push({ label: 'Métier choisi', ok: true })
    else items.push({ label: 'Métier choisi', ok: false })

    if (c.projet_id && c.cohorte_id) items.push({ label: 'Affectation projet/cohorte', ok: true })
    else items.push({ label: 'Affectation projet/cohorte', ok: false })

    // Validation
    if (c.statut !== 'Inscrit') items.push({ label: 'Validation effectuée', ok: true })
    else items.push({ label: 'Validation effectuée', ok: false })

    // Visite médicale
    if (dossier.visites_medicales?.length > 0) items.push({ label: 'Visite médicale', ok: true })
    else items.push({ label: 'Visite médicale', ok: false })

    // Formation
    if (dossier.formations?.length > 0) items.push({ label: 'Inscription formation', ok: true })
    else items.push({ label: 'Inscription formation', ok: false })

    const okCount = items.filter(i => i.ok).length
    return { percent: Math.round((okCount / items.length) * 100), items }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!dossier || !dossier.candidate) {
    return (
      <div className="text-center py-16">
        <User size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Dossier non trouvé</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition">Retour</button>
      </div>
    )
  }

  const { candidate, validation_logs, visites_medicales, formations, stages } = dossier
  const validationLogsList = Array.isArray(validation_logs) ? validation_logs : []
  const visitesList = Array.isArray(visites_medicales) ? visites_medicales : []
  const formationsList = Array.isArray(formations) ? formations : []
  const stagesList = Array.isArray(stages) ? stages : []

  const latestFormation = formationsList[0]
  const latestVisite = visitesList[0]
  const completude = getCompletude()
  const isBlockedStatus = ['Rejeté', 'Inapte', 'Abandonné'].includes(candidate?.statut)

  const isDatePassed = (dateValue) => {
    if (!dateValue) return false
    const today = new Date()
    const date = new Date(dateValue)
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date < today
  }

  const formationOverdue = latestFormation?.statut === 'En formation' && isDatePassed(latestFormation?.date_fin_prevue)
  const stageOverdue = stagesList.some((stage) => stage.statut === 'En cours' && isDatePassed(stage.date_fin_prevue))

  const pendingActions = [
    !isBlockedStatus && !validationLogsList.length && { label: 'Validation de la candidature à effectuer', severity: 'high' },
    !isBlockedStatus && !latestVisite && ['Sélectionné', 'Apte', 'Admis', 'En formation', 'Terminé'].includes(candidate.statut) && {
      label: 'Planifier la visite médicale', severity: 'high'
    },
    !isBlockedStatus && !latestFormation && ['Apte', 'Admis', 'En formation', 'Terminé'].includes(candidate.statut) && {
      label: "Démarrer l'inscription en formation", severity: 'medium'
    },
    !isBlockedStatus && formationOverdue && { label: 'Formation en retard (date fin prévue dépassée)', severity: 'high' },
    !isBlockedStatus && stagesList.length === 0 && candidate.statut === 'Terminé' && { label: 'Aucun stage enregistré après la formation', severity: 'medium' },
    !isBlockedStatus && stageOverdue && { label: 'Un stage en cours est en retard', severity: 'high' }
  ].filter(Boolean)

  const getStatutColor = (statut) => {
    const map = {
      'Inscrit': 'bg-blue-100 text-blue-700',
      'Sélectionné': 'bg-amber-100 text-amber-700',
      'Rejeté': 'bg-red-100 text-red-700',
      'Apte': 'bg-emerald-100 text-emerald-700',
      'Inapte': 'bg-orange-100 text-orange-700',
      'Admis': 'bg-indigo-100 text-indigo-700',
      'En formation': 'bg-blue-100 text-blue-700',
      'Abandonné': 'bg-red-100 text-red-700',
      'Terminé': 'bg-emerald-100 text-emerald-700'
    }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }

  // Timeline steps
  const timelineSteps = [
    {
      key: 'inscription',
      icon: FileText,
      title: 'Inscription',
      date: candidate.date_inscription,
      color: 'blue',
      completed: true,
      statusLabel: 'Terminé'
    },
    {
      key: 'validation',
      icon: Shield,
      title: 'Validation',
      date: validationLogsList[0]?.created_at,
      color: ['Sélectionné', 'Apte', 'Admis', 'En formation', 'Terminé'].includes(candidate.statut) ? 'emerald' : candidate.statut === 'Rejeté' ? 'red' : 'gray',
      completed: candidate.statut !== 'Inscrit',
      statusLabel: candidate.statut === 'Rejeté' ? 'Refusée' : candidate.statut !== 'Inscrit' ? 'Terminée' : 'À faire'
    },
    {
      key: 'visite',
      icon: Stethoscope,
      title: 'Visite Médicale',
      date: latestVisite?.date_visite,
      color: latestVisite ? (latestVisite.apte_physiquement ? 'emerald' : 'red') : 'gray',
      completed: !!latestVisite,
      statusLabel: latestVisite ? 'Terminée' : 'À faire'
    },
    {
      key: 'formation',
      icon: BookOpen,
      title: 'Formation',
      date: latestFormation?.date_debut,
      color: latestFormation ? (latestFormation.statut === 'Abandonné' ? 'red' : latestFormation.statut === 'Terminé' ? 'emerald' : 'blue') : 'gray',
      completed: !!latestFormation,
      statusLabel: !latestFormation ? 'À faire' : formationOverdue ? 'En retard' : latestFormation.statut === 'Terminé' ? 'Terminée' : 'En cours'
    },
    {
      key: 'stages',
      icon: Briefcase,
      title: 'Stages',
      date: stagesList[0]?.date_debut,
      color: stagesList.length > 0 ? 'violet' : 'gray',
      completed: stagesList.length > 0,
      statusLabel: stagesList.length > 0 ? (stageOverdue ? 'En retard' : 'En cours') : 'À faire'
    }
  ]

  const completedSteps = timelineSteps.filter(step => step.completed).length
  const progressionPercent = Math.round((completedSteps / timelineSteps.length) * 100)
  const currentStep = timelineSteps.find(step => !step.completed) || timelineSteps[timelineSteps.length - 1]
  const colorMap = {
    blue: { bg: 'bg-blue-500', ring: 'ring-blue-200', line: 'bg-blue-300' },
    emerald: { bg: 'bg-emerald-500', ring: 'ring-emerald-200', line: 'bg-emerald-300' },
    red: { bg: 'bg-red-500', ring: 'ring-red-200', line: 'bg-red-300' },
    violet: { bg: 'bg-violet-500', ring: 'ring-violet-200', line: 'bg-violet-300' },
    gray: { bg: 'bg-gray-300', ring: 'ring-gray-100', line: 'bg-gray-200' }
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto" ref={printRef}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B3A5C] to-[#234E78] p-5">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition">
              <ArrowLeft size={16} /> Retour
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition"
              >
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {candidate.photo ? (
              <img src={`${API_BASE_URL}/uploads/photos/${candidate.photo}`} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-white/30" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-xl">
                {candidate.prenom?.charAt(0)}{candidate.nom?.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{candidate.prenom} {candidate.nom?.toUpperCase()}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatutColor(candidate.statut)}`}>
                  {candidate.statut}
                </span>
                {candidate.age && <span className="text-white/70 text-sm">{candidate.age} ans</span>}
                {candidate.ville && <span className="text-white/70 text-sm flex items-center gap-1"><MapPin size={12} /> {candidate.ville}</span>}
              </div>
            </div>
          </div>
          {/* Tags affectation */}
          <div className="flex flex-wrap gap-2 mt-3">
            {candidate.projet_nom && (
              <span className="px-2 py-1 bg-white/15 text-white/90 text-xs rounded-lg flex items-center gap-1">
                <FolderOpen size={12} /> {candidate.projet_nom}
              </span>
            )}
            {candidate.cohorte_nom && (
              <span className="px-2 py-1 bg-white/15 text-white/90 text-xs rounded-lg flex items-center gap-1">
                <GraduationCap size={12} /> {candidate.cohorte_nom}
              </span>
            )}
            {candidate.centre_nom && (
              <span className="px-2 py-1 bg-white/15 text-white/90 text-xs rounded-lg flex items-center gap-1">
                <Building2 size={12} /> {candidate.centre_nom}
              </span>
            )}
          </div>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 bg-gray-50">
          <QuickInfo icon={Phone} label="Téléphone" value={candidate.telephone} />
          <QuickInfo icon={Mail} label="Email" value={candidate.email || '—'} />
          <QuickInfo icon={GraduationCap} label="Métier" value={candidate.metier_choisi || '—'} />
          <QuickInfo icon={Calendar} label="Inscrit le" value={fmtDate(candidate.date_inscription)} />
        </div>
      </div>

      {/* Complétude du dossier */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-violet-500" /> Complétude du dossier
          </h2>
          <span className={`text-sm font-bold ${completude.percent === 100 ? 'text-emerald-600' : completude.percent >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {completude.percent}%
          </span>
        </div>
        {/* Barre de progression */}
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${completude.percent === 100 ? 'bg-emerald-500' : completude.percent >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${completude.percent}%` }}
          ></div>
        </div>
        {/* Éléments manquants */}
        <div className="flex flex-wrap gap-2">
          {completude.items.map((item, i) => (
            <span
              key={i}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {item.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Pilotage parcours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Étape actuelle</p>
          <p className="text-sm font-bold text-gray-800">{currentStep?.title}</p>
          <p className="text-xs text-gray-500 mt-1">Progression parcours: {progressionPercent}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 md:col-span-2">
          <p className="text-xs text-gray-500 mb-2">Actions prioritaires</p>
          {pendingActions.length === 0 ? (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle size={14} /> Aucun blocage critique détecté
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pendingActions.map((action, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${action.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}
                >
                  <AlertTriangle size={12} /> {action.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-violet-500" /> Parcours de la candidate
        </h2>

        {/* Timeline bar */}
        <div className="flex items-center mb-6">
          {timelineSteps.map((step, i) => {
            const cm = colorMap[step.color]
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full ${cm.bg} ring-4 ${cm.ring} flex items-center justify-center flex-shrink-0`}>
                  <step.icon size={14} className="text-white" />
                </div>
                {i < timelineSteps.length - 1 && (
                  <div className={`flex-1 h-1 ${step.completed ? cm.line : 'bg-gray-200'}`}></div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex">
          {timelineSteps.map(step => (
            <div key={step.key} className="flex-1 text-center px-1">
              <p className="text-xs font-medium text-gray-700">{step.title}</p>
              <p className="text-xs text-gray-400">{step.date ? fmtDate(step.date) : '—'}</p>
              <span className={`inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                step.statusLabel === 'Terminée' || step.statusLabel === 'Terminé'
                  ? 'bg-emerald-50 text-emerald-700'
                  : step.statusLabel === 'En cours'
                    ? 'bg-blue-50 text-blue-700'
                    : step.statusLabel === 'En retard'
                      ? 'bg-red-50 text-red-700'
                      : step.statusLabel === 'Refusée'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-100 text-gray-600'
              }`}>{step.statusLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections détaillées */}

      {/* 1. Inscription */}
      <CollapsibleSection
        title="Inscription"
        icon={FileText}
        color="blue"
        isOpen={openSections.inscription}
        onToggle={() => toggleSection('inscription')}
      >
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Nom complet" value={`${candidate.prenom} ${candidate.nom}`} />
          <InfoField label="Date de naissance" value={`${fmtDate(candidate.date_naissance)} (${candidate.age} ans)`} />
          <InfoField label="Sexe" value={candidate.sexe === 'F' ? 'Féminin' : 'Masculin'} />
          <InfoField label="Situation matrimoniale" value={candidate.situation_matrimoniale} />
          <InfoField label="Document d'identité" value={`${candidate.type_document || '—'} - ${candidate.numero_document || '—'}`} />
          <InfoField label="Région / Ville" value={`${candidate.region || '—'} / ${candidate.ville || '—'}`} />
          <InfoField label="Téléphone" value={candidate.telephone} />
          <InfoField label="Métier souhaité" value={candidate.metier_choisi} />
          <InfoField label="Niveau d'étude" value={candidate.niveau_etude} />
          <InfoField label="Date d'inscription" value={fmtDate(candidate.date_inscription)} />
        </div>
      </CollapsibleSection>

      {/* 2. Validation */}
      <CollapsibleSection
        title="Validation de candidature"
        icon={Shield}
        color="amber"
        isOpen={openSections.validation}
        onToggle={() => toggleSection('validation')}
        badge={candidate.statut === 'Rejeté' ? 'Rejetée' : candidate.statut !== 'Inscrit' ? 'Validée' : 'En attente'}
        badgeColor={candidate.statut === 'Rejeté' ? 'red' : candidate.statut !== 'Inscrit' ? 'emerald' : 'gray'}
      >
        {validationLogsList.length > 0 ? (
          <div className="space-y-3">
            {validationLogsList.map((log, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">{log.action}</p>
                  <span className="text-xs text-gray-500">{fmtDate(log.created_at)}</span>
                </div>
                {log.details && <p className="text-sm text-gray-600 mt-1">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucun log de validation enregistré</p>
        )}
      </CollapsibleSection>

      {/* 3. Visite Médicale */}
      <CollapsibleSection
        title="Visite Médicale"
        icon={Stethoscope}
        color="emerald"
        isOpen={openSections.visite}
        onToggle={() => toggleSection('visite')}
        badge={latestVisite ? (latestVisite.apte_physiquement ? 'Apte' : 'Inapte') : 'Non effectuée'}
        badgeColor={latestVisite ? (latestVisite.apte_physiquement ? 'emerald' : 'red') : 'gray'}
        linkLabel={latestVisite ? 'Voir détail visite' : null}
        onLinkClick={latestVisite ? () => navigate(`/visites-medicales/${latestVisite.id}`) : null}
      >
        {latestVisite ? (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Date de visite" value={fmtDate(latestVisite.date_visite)} />
              <InfoField label="Médecin" value={latestVisite.medecin_nom ? `Dr. ${latestVisite.medecin_nom}` : '—'} />
              <InfoField label="Établissement" value={latestVisite.etablissement} />
              <InfoField label="Résultat" value={latestVisite.apte_physiquement ? 'APTE' : 'INAPTE'} highlight={latestVisite.apte_physiquement ? 'green' : 'red'} />
              <InfoField label="Test grossesse" value={latestVisite.test_grossesse || 'N/A'} />
              <InfoField label="Statut visite" value={latestVisite.statut} />
            </div>
            {latestVisite.observations && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-xs font-medium text-yellow-800">Observations</p>
                <p className="text-sm text-yellow-700 mt-1">{latestVisite.observations}</p>
              </div>
            )}
            {/* Historique visites multiples */}
            {visitesList.length > 1 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-2">Historique des visites ({visitesList.length} au total)</p>
                {visitesList.slice(1).map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-xs border-b border-blue-100 last:border-0">
                    <span className="text-blue-700">{fmtDate(v.date_visite)} - {v.medecin_nom ? `Dr. ${v.medecin_nom}` : 'N/A'}</span>
                    <span className={v.apte_physiquement ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                      {v.apte_physiquement ? 'Apte' : 'Inapte'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune visite médicale enregistrée</p>
        )}
      </CollapsibleSection>

      {/* 4. Formation */}
      <CollapsibleSection
        title="Formation"
        icon={BookOpen}
        color="violet"
        isOpen={openSections.formation}
        onToggle={() => toggleSection('formation')}
        badge={latestFormation?.statut || 'Non inscrite'}
        badgeColor={latestFormation?.statut === 'En formation' ? 'blue' : latestFormation?.statut === 'Abandonné' ? 'red' : latestFormation?.statut === 'Terminé' ? 'emerald' : 'gray'}
        linkLabel={latestFormation ? 'Voir formations' : null}
        onLinkClick={latestFormation ? () => navigate('/formations') : null}
      >
        {latestFormation ? (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Date de début" value={fmtDate(latestFormation.date_debut)} />
              <InfoField label="Date fin prévue" value={fmtDate(latestFormation.date_fin_prevue)} />
              <InfoField label="Cohorte" value={latestFormation.cohorte_nom} />
              <InfoField label="Centre" value={latestFormation.centre_nom} />
              <InfoField label="Projet" value={latestFormation.projet_nom} />
              <InfoField label="Statut" value={latestFormation.statut} highlight={latestFormation.statut === 'Abandonné' ? 'red' : latestFormation.statut === 'Terminé' ? 'green' : 'blue'} />
            </div>

            {/* Durée calculée */}
            {latestFormation.date_debut && (
              <div className="mt-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
                <p className="text-xs font-medium text-violet-800">
                  Durée: {Math.max(0, Math.ceil((new Date(latestFormation.date_fin_effective || latestFormation.date_fin_prevue || Date.now()) - new Date(latestFormation.date_debut)) / 86400000))} jours
                  {latestFormation.date_fin_prevue && new Date(latestFormation.date_fin_prevue) < new Date() && latestFormation.statut === 'En formation' && (
                    <span className="ml-2 text-orange-600 font-bold">- En retard</span>
                  )}
                </p>
              </div>
            )}

            {/* Détails abandon */}
            {latestFormation.statut === 'Abandonné' && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                <h4 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} /> Fiche d'abandon
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoField label="Date d'abandon" value={fmtDate(latestFormation.date_abandon)} />
                  <InfoField label="Signalé par" value={latestFormation.signale_par || '—'} />
                  <div className="col-span-2">
                    <InfoField label="Motif" value={latestFormation.motif_abandon} />
                  </div>
                  {latestFormation.details_abandon && (
                    <div className="col-span-2">
                      <InfoField label="Détails" value={latestFormation.details_abandon} />
                    </div>
                  )}
                  {latestFormation.circonstances_abandon && (
                    <div className="col-span-2">
                      <InfoField label="Circonstances / Faits" value={latestFormation.circonstances_abandon} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {latestFormation.statut === 'Terminé' && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800">Formation terminée avec succès</p>
                </div>
                {latestFormation.date_fin_effective && (
                  <p className="text-sm text-emerald-700 mt-1">Date de fin: {fmtDate(latestFormation.date_fin_effective)}</p>
                )}
              </div>
            )}

            {latestFormation.observations && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-600">Observations</p>
                <p className="text-sm text-gray-700 mt-1">{latestFormation.observations}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune formation enregistrée</p>
        )}
      </CollapsibleSection>

      {/* 5. Stages */}
      <CollapsibleSection
        title="Stages & Missions"
        icon={Briefcase}
        color="indigo"
        isOpen={openSections.stages}
        onToggle={() => toggleSection('stages')}
        badge={stagesList.length > 0 ? `${stagesList.length} stage(s)` : 'Aucun'}
        badgeColor={stagesList.length > 0 ? 'indigo' : 'gray'}
        linkLabel={stagesList.length > 0 ? 'Voir les stages' : null}
        onLinkClick={stagesList.length > 0 ? () => navigate('/stages') : null}
      >
        {stagesList.length > 0 ? (
          <div className="space-y-3">
            {stagesList.map((stage, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-800">{stage.entreprise_nom || 'Entreprise inconnue'}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      stage.statut === 'Terminé' ? 'bg-emerald-100 text-emerald-700' :
                      stage.statut === 'En cours' ? 'bg-blue-100 text-blue-700' :
                      stage.statut === 'Abandonné' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{stage.statut}</span>
                    {stage.id && (
                      <button
                        onClick={() => navigate(`/stages/${stage.id}`)}
                        className="p-1 text-gray-400 hover:text-violet-600 rounded transition"
                        title="Voir le détail du stage"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-500">Type:</span> <span className="text-gray-700">{stage.type_stage || '—'}</span></div>
                  <div><span className="text-gray-500">Début:</span> <span className="text-gray-700">{fmtDate(stage.date_debut)}</span></div>
                  <div><span className="text-gray-500">Fin:</span> <span className="text-gray-700">{fmtDate(stage.date_fin)}</span></div>
                  <div><span className="text-gray-500">Métier:</span> <span className="text-gray-700">{stage.metier_stage || '—'}</span></div>
                  <div><span className="text-gray-500">Tuteur:</span> <span className="text-gray-700">{stage.tuteur_nom || '—'}</span></div>
                  <div><span className="text-gray-500">Secteur:</span> <span className="text-gray-700">{stage.secteur_activite || '—'}</span></div>
                </div>
                {stage.statut === 'Abandonné' && stage.motif_abandon && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                    <strong>Motif d'abandon:</strong> {stage.motif_abandon}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucun stage enregistré</p>
        )}
      </CollapsibleSection>
    </div>
  )
}

// Collapsible Section - enhanced with link button
function CollapsibleSection({ title, icon: Icon, color, isOpen, onToggle, badge, badgeColor, linkLabel, onLinkClick, children }) {
  const colorBg = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  }

  const badgeColors = {
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    gray: 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorBg[color]}`}>
            <Icon size={16} />
          </div>
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          {badge && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeColors[badgeColor] || badgeColors.gray}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {linkLabel && onLinkClick && (
            <span
              onClick={(e) => { e.stopPropagation(); onLinkClick(); }}
              className="text-xs text-violet-600 hover:text-violet-800 hover:underline cursor-pointer flex items-center gap-1"
            >
              <ExternalLink size={12} /> {linkLabel}
            </span>
          )}
          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

// Info field
function InfoField({ label, value, highlight }) {
  const highlightColors = {
    green: 'text-emerald-700 font-semibold',
    red: 'text-red-700 font-semibold',
    blue: 'text-blue-700 font-semibold'
  }

  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm ${highlight ? highlightColors[highlight] : 'text-gray-800'}`}>{value || '—'}</p>
    </div>
  )
}

// Quick info for header
function QuickInfo({ icon: Icon, label, value }) {
  return (
    <div className="p-3 text-center">
      <Icon size={14} className="mx-auto text-gray-400 mb-1" />
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xs font-medium text-gray-800 truncate">{value || '—'}</p>
    </div>
  )
}
