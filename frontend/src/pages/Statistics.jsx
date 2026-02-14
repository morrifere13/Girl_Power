import { useEffect, useState } from 'react'
import { statsAPI, exportAPI } from '../services/api'
import {
  TrendingUp, Users, MapPin, Award, PieChart as PieChartIcon,
  BarChart3, Activity, Briefcase, GraduationCap, Heart, Download, Baby
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

export default function Statistics() {
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

  const handleExport = () => {
    exportAPI.exportStats()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!stats) return null

  // Couleurs pour les graphiques
  const COLORS = ['#e04f65', '#fb923c', '#2dd4bf', '#3b82f6', '#a78bfa', '#f472b6', '#ef4444', '#06b6d4', 'gold']

  // Préparer les données pour les graphiques
  const regionsData = stats.repartitions.regions.map(item => ({
    name: item.region,
    value: item.nombre,
    percentage: ((item.nombre / stats.resume.total_candidates) * 100).toFixed(1)
  }))

  const diplomesData = stats.repartitions.diplomes.map(item => ({
    name: item.diplome,
    value: item.nombre,
    percentage: ((item.nombre / stats.resume.total_candidates) * 100).toFixed(1)
  }))

  const matrimonialData = stats.repartitions.situation_matrimoniale ? stats.repartitions.situation_matrimoniale.map(item => ({
    name: item.situation_matrimoniale,
    value: item.nombre,
    percentage: ((item.nombre / stats.resume.total_candidates) * 100).toFixed(1)
  })) : []

  const educationData = stats.repartitions.niveau_etude ? stats.repartitions.niveau_etude.map(item => ({
    name: item.niveau_etude,
    value: item.nombre
  })) : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Statistiques Détaillées</h1>
          <p className="text-gray-500 mt-1">Analyses approfondies et visualisations des données.</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download size={20} />
          <span>Exporter Excel</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Candidates</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{stats.resume.total_candidates}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Régions Couvertes</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{stats.resume.total_regions}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mères de famille</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">{stats.resume.avec_enfants}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Enfants</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{stats.resume.total_enfants}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <Baby size={24} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Graphique à barres - Régions */}
        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-primary-600" size={20} />
              Répartition par Région
            </h2>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name, props) => [
                    `${value} candidates (${props.payload.percentage}%)`,
                    'Nombre'
                  ]}
                />
                <Bar
                  dataKey="value"
                  name="Candidates"
                  fill="#e04f65"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique circulaire - Situation Matrimoniale */}
        {matrimonialData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Heart className="text-pink-600" size={20} />
                Situation Matrimoniale
              </h2>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matrimonialData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={5}
                  >
                    {matrimonialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name, props) => [
                      `${value} candidates (${props.payload.percentage}%)`,
                      props.payload.name
                    ]}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    formatter={(value) => <span className="text-sm text-gray-600 font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graphique à barres - Niveau d'étude */}
        {educationData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="text-blue-600" size={20} />
                Niveau d'Études
              </h2>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Candidates"
                    fill="#3b82f6"
                    radius={[0, 6, 6, 0]}
                    barSize={30}
                    label={{ position: 'right', fill: '#6b7280', fontSize: 12 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graphique circulaire - Diplômes */}
        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="text-purple-600" size={20} />
              Diplômes Obtenus
            </h2>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diplomesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                >
                  {diplomesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name, props) => [
                    `${value} candidates (${props.payload.percentage}%)`,
                    props.payload.name
                  ]}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value) => <span className="text-sm text-gray-600 font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
