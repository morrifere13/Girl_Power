import { useEffect, useState } from 'react'
import { statsAPI } from '../services/api'
import { Users, MapPin, Building2, Baby, School, User2, FileSpreadsheet, TrendingUp, Award, FileText } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await statsAPI.getDashboard()
      setStats(response.data)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!stats) return null

  const { resume, top5, repartitions, age_candidates, age_enfants } = stats

  // Data transformers
  const regionsData = top5.regions.map(r => ({ name: r.region, value: r.nombre }))
  const ageData = age_candidates.tranches.map(t => ({ name: t.tranche, value: t.nombre }))
  const diplomeData = repartitions.diplomes.map(d => ({ name: d.diplome, value: d.nombre }))

  const COLORS = ['#e04f65', '#2dd4bf', '#fb923c', '#f472b6', '#a78bfa', '#60a5fa']

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="section-header no-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Vue d'ensemble</h1>
          <p className="text-gray-500 mt-1">Bienvenue sur votre tableau de bord de gestion.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center space-x-2"
        >
          <FileSpreadsheet size={18} />
          <span>Exporter le rapport</span>
        </button>
      </div>

      {/* Statistiques Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Candidates</p>
            <p className="text-3xl font-bold text-gray-900">{resume.total_candidates}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Couverture Régionale</p>
            <p className="text-3xl font-bold text-gray-900">{resume.total_regions} <span className="text-sm font-normal text-gray-400">régions</span></p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Impact Familial</p>
            <p className="text-3xl font-bold text-gray-900">{resume.avec_enfants} <span className="text-sm font-normal text-gray-400">mères</span></p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <Baby size={24} />
          </div>
        </div>
      </div>

      {/* Detailed Stats Row 2 (Mini cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card-flat flex items-center space-x-4">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><School size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{resume.enfants_au_centre}</p>
            <p className="text-xs text-gray-500">Enfants au centre</p>
          </div>
        </div>
        <div className="card-flat flex items-center space-x-4">
          <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><User2 size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{resume.meres_au_centre}</p>
            <p className="text-xs text-gray-500">Mères au centre</p>
          </div>
        </div>
        <div className="card-flat flex items-center space-x-4">
          <div className="p-2 bg-green-100 rounded-lg text-green-600"><Building2 size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{resume.total_villes}</p>
            <p className="text-xs text-gray-500">Villes actives</p>
          </div>
        </div>
      </div>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
        {/* Graphique Ages */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <TrendingUp size={20} className="text-primary-500" />
              <span>Démographie par Âge</span>
            </h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" name="Candidates" fill="#e04f65" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique Diplomes */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <Award size={20} className="text-accent-DEFAULT" />
              <span>Niveau d'Études</span>
            </h2>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diplomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {diplomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TOP 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Régions */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center space-x-2">
            <MapPin size={18} className="text-blue-500" />
            <span>Top Régions</span>
          </h2>
          {/* Mini Chart for Regions */}
          <div className="h-24 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionsData} layout="vertical" margin={{ left: 0, right: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '12px' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {top5.regions.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-surface-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <span className="text-sm font-medium text-gray-700">{item.region}</span>
                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {item.nombre}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Villes */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center space-x-2">
            <Building2 size={18} className="text-purple-500" />
            <span>Top Villes</span>
          </h2>
          <div className="space-y-3 pt-4">
            {top5.villes.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-surface-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <span className="text-sm font-medium text-gray-700">{item.ville}</span>
                <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {item.nombre}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Métiers */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center space-x-2">
            <FileText size={18} className="text-green-500" />
            <span>Top Métiers</span>
          </h2>
          <div className="space-y-3 pt-4">
            {top5.metiers.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-surface-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <span className="text-sm font-medium text-gray-700">{item.metier_choisi}</span>
                <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {item.nombre}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
