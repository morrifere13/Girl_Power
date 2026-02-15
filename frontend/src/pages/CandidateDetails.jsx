import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { candidatesAPI, API_BASE_URL } from '../services/api'
import {
  ArrowLeft, Edit, Trash2, Printer, User, MapPin,
  FileText, GraduationCap, Briefcase, Baby, Download,
  Phone, Mail, Calendar, Clock,
  Users, History, Paperclip, Award, Eye, Route,
  Building2, FolderOpen, Layers
} from 'lucide-react'
import FilePreviewModal from '../components/FilePreviewModal'

export default function CandidateDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [previewFile, setPreviewFile] = useState(null)

  useEffect(() => {
    loadCandidate()
  }, [id])

  useEffect(() => {
    if (activeTab === 'history' && candidate) {
      loadLogs()
    }
  }, [activeTab, candidate])

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/api/audit/candidate/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLogs(response.data.data)
    } catch (error) {
      console.error('Erreur logs:', error)
    }
  }

  const loadCandidate = async () => {
    try {
      const response = await candidatesAPI.getById(id)
      console.log('Données candidat reçues:', response.data)
      console.log('Affectation:', {
        projet_id: response.data.projet_id,
        projet_nom: response.data.projet_nom,
        cohorte_id: response.data.cohorte_id,
        cohorte_nom: response.data.cohorte_nom,
        centre_id: response.data.centre_id,
        centre_nom: response.data.centre_nom
      })
      setCandidate(response.data)
    } catch (error) {
      console.error('Erreur chargement candidate:', error)
      navigate('/candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette candidate ?')) {
      try {
        await candidatesAPI.delete(id)
        toast.success('Candidate supprimée avec succès!')
        navigate('/candidates')
      } catch (error) {
        console.error('Erreur suppression:', error)
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handlePrint = () => window.print()

  const handleExportPDF = () => {
    const token = localStorage.getItem('token')
    window.open(`${API_BASE_URL}/api/candidates/export/pdf/${id}?token=${token}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!candidate) return null

  const tabs = [
    { id: 'general', label: 'Informations', icon: User },
    { id: 'affectation', label: 'Affectation', icon: Building2 },
    { id: 'contact', label: 'Localisation', icon: MapPin },
    { id: 'formation', label: 'Pro & Études', icon: Briefcase },
    { id: 'famille', label: 'Famille', icon: Users },
    { id: 'history', label: 'Historique', icon: History },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'Acceptée':
      case 'VALIDEE':
      case 'Validée':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'En formation':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Refusée':
      case 'REFUSEE':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'Diplômée':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded-lg">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-xs font-medium text-gray-900 text-right">{value || '—'}</dd>
    </div>
  )

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

  const detailedAge = candidate ? calculateDetailedAge(candidate.date_naissance) : null

  const formatAction = (action) => {
    const actionMap = {
      'CREATE': { label: 'Création', color: 'bg-green-500', icon: '✨' },
      'UPDATE': { label: 'Modification', color: 'bg-blue-500', icon: '✏️' },
      'DELETE': { label: 'Suppression', color: 'bg-red-500', icon: '🗑️' },
      'VALIDATE': { label: 'Validation', color: 'bg-purple-500', icon: '✅' },
    }
    return actionMap[action] || { label: action, color: 'bg-gray-500', icon: '📝' }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${candidate.statut === 'Validé' || candidate.statut === 'En formation' || candidate.statut === 'VALIDEE' ? 'bg-blue-600' : candidate.statut === 'Acceptée' ? 'bg-green-600' : 'bg-gray-400'}`}></div>

          <div className="flex flex-col gap-6">
            {/* Top Row - Back button */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate('/candidates')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 border border-gray-200"
              >
                <ArrowLeft size={18} />
                Retour à la liste
              </button>
              <Link
                to={`/parcours/${id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
              >
                <Route size={16} />
                Voir parcours
              </Link>
            </div>

            {/* Main Content */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
              <div className="flex-1">
                {/* Photo & Badges */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  {candidate.photo && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm flex-shrink-0">
                      <img src={`http://localhost:5000${candidate.photo}`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border ${getStatusColor(candidate.statut)}`}>
                      {candidate.statut}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {candidate.sexe === 'F' ? 'Femme' : 'Homme'}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      {candidate.situation_matrimoniale}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-1">
                  {candidate.nom} {candidate.prenom}
                </h1>
                {candidate.surnom && (
                  <p className="text-gray-600 italic text-sm mb-2">"{candidate.surnom}"</p>
                )}

                {/* Location & Age */}
                <div className="flex items-center gap-4 text-gray-500 font-medium text-sm flex-wrap mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    {candidate.ville}, {candidate.region}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {detailedAge ? `${detailedAge.years} ans, ${detailedAge.months} mois` : `${candidate.age} ans`}
                  </div>
                </div>

                {/* Affectation Summary */}
                {(candidate.projet_nom || candidate.cohorte_nom || candidate.centre_nom) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidate.projet_nom && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-100 text-violet-800 border border-violet-200">
                        <FolderOpen size={14} />
                        {candidate.projet_nom}
                      </span>
                    )}
                    {candidate.cohorte_nom && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <Layers size={14} />
                        {candidate.cohorte_nom}
                      </span>
                    )}
                    {candidate.centre_nom && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <Building2 size={14} />
                        {candidate.centre_nom}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-col gap-2 min-w-[180px]">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-1.5 bg-gray-50 rounded-md text-gray-400">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Niveau</div>
                    <div className="text-sm font-bold text-gray-900">{candidate.niveau_etude || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-1.5 bg-gray-50 rounded-md text-gray-400">
                    <Baby size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Enfants</div>
                    <div className="text-sm font-bold text-gray-900">{candidate.nombre_enfants_charge || 0} en charge</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-1.5 bg-gray-50 rounded-md text-gray-400">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Métier</div>
                    <div className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{candidate.metier_choisi || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-t border-gray-200 -mx-6 px-6 pt-4">
              <nav className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 border
                        ${activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 gap-6">

          {/* General Info */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <FileText size={16} />
                  </div>
                  Identité & Documents
                </h3>
                <dl className="space-y-1">
                  <InfoRow label="Nom complet" value={`${candidate.nom} ${candidate.prenom}`} />
                  <InfoRow label="Surnom" value={candidate.surnom} />
                  <InfoRow label="Sexe" value={candidate.sexe === 'F' ? 'Féminin' : 'Masculin'} />
                  <InfoRow label="Date de naissance" value={candidate.date_naissance ? new Date(candidate.date_naissance).toLocaleDateString('fr-FR') : ''} />
                  <InfoRow label="Lieu de naissance" value={candidate.lieu_naissance} />
                  <InfoRow label="Situation matrimoniale" value={candidate.situation_matrimoniale} />
                  <InfoRow label="Type de document" value={candidate.type_document} />
                  <InfoRow label="Numéro document" value={candidate.numero_document} />
                  <InfoRow label="Date validité" value={candidate.date_validite_document ? new Date(candidate.date_validite_document).toLocaleDateString('fr-FR') : ''} />
                  <InfoRow label="N° NNI" value={candidate.nni} />
                  <InfoRow label="N° CMU" value={candidate.cmu} />
                  <InfoRow label="N° AEJ" value={candidate.aej_numero} />
                </dl>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-600 rounded-lg p-5 shadow-sm text-white border border-blue-700">
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Award size={16} />
                    Statut Actuel
                  </h3>
                  <p className="opacity-90 mb-4 text-sm">
                    Dossier actuellement <strong className="text-white">{candidate.statut?.toLowerCase()}</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm border border-white/30">
                      <span className="block text-2xl font-bold">{candidate.age}</span>
                      <span className="text-xs opacity-90">Ans</span>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm border border-white/30">
                      <span className="block text-2xl font-bold">{candidate.nombre_enfants_charge || 0}</span>
                      <span className="text-xs opacity-90">Enfants à charge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Affectation Tab */}
          {activeTab === 'affectation' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                  <Building2 size={20} />
                </div>
                Affectation du Candidat
              </h3>

              {!candidate.projet_id && !candidate.cohorte_id && !candidate.centre_id ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Aucune affectation</h4>
                  <p className="text-gray-500 mb-4">Ce candidat n'est pas encore affecté à un projet, une cohorte ou un centre.</p>
                  <Link
                    to={`/candidates/${id}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit size={16} />
                    Affecter maintenant
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Projet Card */}
                  <div className={`p-5 rounded-xl border-2 ${candidate.projet_id ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-lg ${candidate.projet_id ? 'bg-violet-200 text-violet-700' : 'bg-gray-200 text-gray-500'}`}>
                        <FolderOpen size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Projet</p>
                        <h4 className={`text-lg font-bold ${candidate.projet_id ? 'text-violet-900' : 'text-gray-400'}`}>
                          {candidate.projet_nom || 'Non affecté'}
                        </h4>
                      </div>
                    </div>
                    {candidate.projet_code && (
                      <p className="text-sm text-violet-600 font-mono bg-violet-100 px-2 py-1 rounded inline-block">
                        {candidate.projet_code}
                      </p>
                    )}
                  </div>

                  {/* Cohorte Card */}
                  <div className={`p-5 rounded-xl border-2 ${candidate.cohorte_id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-lg ${candidate.cohorte_id ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                        <Layers size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cohorte</p>
                        <h4 className={`text-lg font-bold ${candidate.cohorte_id ? 'text-blue-900' : 'text-gray-400'}`}>
                          {candidate.cohorte_nom || 'Non affecté'}
                        </h4>
                      </div>
                    </div>
                    {candidate.cohorte_code && (
                      <p className="text-sm text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded inline-block">
                        {candidate.cohorte_code}
                      </p>
                    )}
                  </div>

                  {/* Centre Card */}
                  <div className={`p-5 rounded-xl border-2 ${candidate.centre_id ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-lg ${candidate.centre_id ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        <Building2 size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Centre</p>
                        <h4 className={`text-lg font-bold ${candidate.centre_id ? 'text-green-900' : 'text-gray-400'}`}>
                          {candidate.centre_nom || 'Non affecté'}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Info */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                      <MapPin size={16} />
                    </div>
                    Adresse et Logement
                  </h3>
                  <dl className="space-y-1">
                    <InfoRow label="Région" value={candidate.region} />
                    <InfoRow label="Chef-lieu Région" value={candidate.region_chef_lieu} />
                    <InfoRow label="Ville" value={candidate.ville} />
                    <InfoRow label="Quartier" value={candidate.quartier} />
                    <InfoRow label="Adresse" value={candidate.adresse} />
                    <InfoRow label="Repère" value={candidate.repere_logement} />
                    <InfoRow label="Transport (Coût)" value={candidate.prix_transport ? `${candidate.prix_transport.toLocaleString()} FCFA` : ''} />
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                      <Phone size={16} />
                    </div>
                    Contacts & Urgence
                  </h3>
                  <dl className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Contacts Personnels</p>
                      <div className="flex items-center gap-3 mb-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="font-bold text-gray-900">{candidate.telephone}</span>
                      </div>
                      {candidate.telephone_2 && (
                        <div className="flex items-center gap-3 mb-2">
                          <Phone size={16} className="text-gray-400" />
                          <span className="font-bold text-gray-900">{candidate.telephone_2}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-700">{candidate.email || 'Aucun email'}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs font-bold text-red-500 uppercase mb-2">En cas d'urgence</p>
                      <p className="font-bold text-gray-900">{candidate.urgence_nom || 'Non défini'}</p>
                      <p className="text-sm text-gray-600">{candidate.urgence_affiliation}</p>
                      {candidate.urgence_profession && (
                        <p className="text-sm text-gray-500 mb-2">Profession: {candidate.urgence_profession}</p>
                      )}
                      <div className="flex gap-4 mt-2">
                        {candidate.urgence_contact1 && <span className="text-red-700 font-mono bg-red-100 px-2 rounded">{candidate.urgence_contact1}</span>}
                        {candidate.urgence_contact2 && <span className="text-red-700 font-mono bg-red-100 px-2 rounded">{candidate.urgence_contact2}</span>}
                      </div>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Formation */}
          {activeTab === 'formation' && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                      <GraduationCap size={16} />
                    </div>
                    Cursus Scolaire
                  </h3>
                  <dl className="space-y-1">
                    <InfoRow label="Niveau d'étude" value={candidate.niveau_etude} />
                    <InfoRow label="Dernier Diplôme" value={candidate.diplome} />
                    <InfoRow label="Année d'obtention" value={candidate.annee_diplome} />
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                      <Briefcase size={16} />
                    </div>
                    Activité & Projet
                  </h3>
                  <dl className="space-y-1">
                    <InfoRow label="Activité Actuelle" value={candidate.activite_actuelle} />
                    <InfoRow label="Revenu Mensuel" value={candidate.revenu_mensuel ? `${candidate.revenu_mensuel.toLocaleString()} FCFA` : ''} />
                    <InfoRow label="Max géré" value={candidate.plus_grande_somme_gere ? `${candidate.plus_grande_somme_gere.toLocaleString()} FCFA` : ''} />
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Métier Choisi</p>
                      <p className="text-lg font-bold text-blue-600">{candidate.metier_choisi || 'Non défini'}</p>
                    </div>
                  </dl>
                </div>
              </div>

              {candidate.diplomes && candidate.diplomes.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mt-4 border border-purple-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                      <Award size={16} />
                    </div>
                    Diplômes obtenus
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {candidate.diplomes.map((dip, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{dip.diplome}</p>
                            {dip.annee_obtention && (
                              <p className="text-sm text-gray-500 mt-1">Année: {dip.annee_obtention}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {candidate.fichiers && candidate.fichiers.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mt-4 border border-blue-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                      <Paperclip size={16} />
                    </div>
                    Fichiers joints ({candidate.fichiers.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {candidate.fichiers.map((fichier, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-300 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Paperclip className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{fichier.nom_fichier}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-500">{(fichier.taille_fichier / 1024).toFixed(2)} KB</p>
                              <p className="text-xs text-gray-400">{new Date(fichier.date_upload).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewFile(fichier)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Aperçu"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a
                              href={`${API_BASE_URL}${fichier.chemin_fichier}`}
                              download={fichier.nom_fichier}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Famille */}
          {activeTab === 'famille' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <Users size={16} />
                  </div>
                  Informations Parents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-blue-900">Père</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        candidate.pere_vivant === false
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {candidate.pere_vivant === false ? 'Décédé' : 'Vivant'}
                      </span>
                    </div>
                    <dl className="space-y-1">
                      <InfoRow label="Nom" value={candidate.pere_nom} />
                      <InfoRow label="Profession" value={candidate.pere_profession} />
                      <InfoRow label="Contacts" value={[candidate.pere_contact1, candidate.pere_contact2].filter(Boolean).join(' / ')} />
                    </dl>
                  </div>
                  <div className="p-4 bg-pink-50/50 rounded-xl border border-pink-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-pink-900">Mère</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        candidate.mere_vivante === false
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {candidate.mere_vivante === false ? 'Décédée' : 'Vivante'}
                      </span>
                    </div>
                    <dl className="space-y-1">
                      <InfoRow label="Nom" value={candidate.mere_nom} />
                      <InfoRow label="Profession" value={candidate.mere_profession} />
                      <InfoRow label="Contacts" value={[candidate.mere_contact1, candidate.mere_contact2].filter(Boolean).join(' / ')} />
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
                      <Baby size={16} />
                    </div>
                    <span>Situation Familiale ({candidate.enfants?.length || candidate.nombre_enfants || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {candidate.a_des_enfants && (
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                        {candidate.nombre_enfants_charge} en charge
                      </span>
                    )}
                    {candidate.enfants_au_centre && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-lg">
                        Enfants au centre
                      </span>
                    )}
                  </div>
                </h3>

                {!candidate.a_des_enfants || (!candidate.enfants || candidate.enfants.length === 0) ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                    <Baby size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">
                      {candidate.a_des_enfants && candidate.nombre_enfants > 0
                        ? `${candidate.nombre_enfants} enfant(s) déclaré(s) mais non enregistré(s) dans le système.`
                        : 'Aucun enfant déclaré pour cette candidate.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidate.enfants && candidate.enfants.map((enfant, idx) => (
                      <div key={idx} className="flex p-4 border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all bg-white justify-between items-center">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 shrink-0 font-bold ${
                            enfant.sexe === 'F' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {enfant.prenom?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{enfant.prenom} {enfant.nom}</h4>
                            <p className="text-sm text-gray-500">
                              {enfant.sexe === 'F' ? 'Fille' : 'Garçon'} • {enfant.age} ans
                              {enfant.date_naissance && ` • ${new Date(enfant.date_naissance).toLocaleDateString('fr-FR')}`}
                            </p>
                          </div>
                        </div>
                        {enfant.au_centre && (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                            Au centre
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Historique - Improved */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <History size={20} />
                </div>
                Historique des Actions
              </h3>

              {logs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <History size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Aucune activité</h4>
                  <p className="text-gray-500">Aucune activité enregistrée pour cette candidate.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => {
                    const actionInfo = formatAction(log.action)
                    return (
                      <div
                        key={log.id}
                        className="relative bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${actionInfo.color} flex items-center justify-center text-white text-lg`}>
                              {actionInfo.icon}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 text-base">{actionInfo.label}</span>
                              <p className="text-sm text-gray-500">
                                Par <span className="font-medium text-gray-700">{log.user_email}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                            <Clock size={14} />
                            <span>{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                          </div>
                        </div>

                        {log.changes && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            {log.action === 'UPDATE' && log.changes.before && log.changes.after ? (
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Modifications</p>
                                <div className="grid gap-2">
                                  {Object.keys(log.changes.after).map(key => {
                                    const before = log.changes.before[key]
                                    const after = log.changes.after[key]
                                    if (before !== after && key !== 'updated_at' && key !== 'date_modification') {
                                      return (
                                        <div key={key} className="flex flex-wrap items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                                          <span className="font-semibold text-gray-700 min-w-[120px]">{key}:</span>
                                          <span className="text-red-600 line-through bg-red-50 px-2 py-0.5 rounded">
                                            {String(before || '(vide)')}
                                          </span>
                                          <span className="text-gray-400">→</span>
                                          <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">
                                            {String(after || '(vide)')}
                                          </span>
                                        </div>
                                      )
                                    }
                                    return null
                                  })}
                                </div>
                              </div>
                            ) : log.action === 'VALIDATE' && log.changes.comment ? (
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Commentaire de validation</p>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic">"{log.changes.comment}"</p>
                              </div>
                            ) : (
                              <details className="group">
                                <summary className="text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none">
                                  Voir les détails
                                </summary>
                                <pre className="mt-2 text-xs font-mono text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Preview Modal */}
        {previewFile && (
          <FilePreviewModal
            file={previewFile}
            files={candidate.fichiers || []}
            onClose={() => setPreviewFile(null)}
            onNavigate={(file) => setPreviewFile(file)}
          />
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-bold text-gray-900">{candidate.nom} {candidate.prenom}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(candidate.statut)}`}>
                {candidate.statut}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-white text-gray-600 hover:bg-gray-50 rounded-lg transition-all border border-gray-300 hover:border-gray-400 text-sm font-medium"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 bg-white text-gray-600 hover:bg-gray-50 rounded-lg transition-all border border-gray-300 hover:border-gray-400 text-sm font-medium"
              >
                <Download size={16} />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <Link
                to={`/parcours/${id}`}
                className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg transition-all border border-violet-200 text-sm font-medium"
              >
                <Route size={16} />
                <span className="hidden sm:inline">Parcours</span>
              </Link>
              <Link
                to={`/candidates/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-all shadow-sm"
              >
                <Edit size={16} />
                <span>Modifier</span>
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all border border-red-200 hover:border-red-300 text-sm font-medium"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
