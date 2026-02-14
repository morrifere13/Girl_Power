import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Search, Filter, Calendar, User, Activity, Clock, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

import { API_BASE_URL } from '../services/api'

export default function AuditLogs() {
    const { user } = useAuth()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        totalPages: 1,
        totalLogs: 0
    })
    const [filters, setFilters] = useState({
        action: '',
        entity_type: '',
        user_id: '',
        startDate: '',
        endDate: ''
    })

    useEffect(() => {
        fetchLogs()
    }, [pagination.page, filters])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            })

            // Clean empty filters
            Object.keys(filters).forEach(key => {
                if (!filters[key]) params.delete(key)
            })

            const response = await axios.get(`${API_BASE_URL}/api/audit?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setLogs(response.data.data)
            setPagination(prev => ({
                ...prev,
                totalPages: response.data.totalPages,
                totalLogs: response.data.totalLogs
            }))
        } catch (error) {
            console.error('Error fetching logs:', error)
            toast.error('Impossible de charger les logs d\'audit')
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
        setPagination(prev => ({ ...prev, page: 1 }))
    }

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800'
            case 'UPDATE': return 'bg-blue-100 text-blue-800'
            case 'DELETE': return 'bg-red-100 text-red-800'
            case 'LOGIN': return 'bg-purple-100 text-purple-800'
            case 'LOGOUT': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-xl text-red-600">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Journal d'Audit & Sécurité</h1>
                        <p className="text-gray-500 mt-1">Tracez toutes les actions effectuées sur la plateforme</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Action</label>
                        <select
                            className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none"
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                        >
                            <option value="">Toutes les actions</option>
                            <option value="CREATE">Création</option>
                            <option value="UPDATE">Modification</option>
                            <option value="DELETE">Suppression</option>
                            <option value="LOGIN">Connexion</option>
                            <option value="LOGOUT">Déconnexion</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Entité</label>
                        <select
                            className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none"
                            value={filters.entity_type}
                            onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                        >
                            <option value="">Toutes les entités</option>
                            <option value="candidate">Candidates</option>
                            <option value="user">Utilisateurs</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Date Début</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Date Fin</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Utilisateur</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Entité</th>
                                    <th className="px-6 py-4">Détails (ID)</th>
                                    <th className="px-6 py-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-400" />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {log.user_email ? log.user_email[0].toUpperCase() : '?'}
                                                </div>
                                                <span className="font-medium text-gray-900">{log.user_email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 uppercase text-xs font-bold tracking-wide">
                                            {log.entity_type}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                            #{log.entity_id || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                                            {log.ip_address}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            Aucun historique trouvé pour ces critères.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                        Page {pagination.page} sur {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page <= 1}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
