import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, FolderOpen, Edit, Trash2,
    MoreVertical, CheckCircle2, Users, MapPin, Eye
} from 'lucide-react';

export default function ProjectCard({ project, onDelete, onEdit }) {
    const navigate = useNavigate();

    const getStatusColor = (status) => {
        switch (status) {
            case 'EN_COURS': return 'bg-green-100 text-green-700 border-green-200';
            case 'PLANIFIE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'CLOTURE': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'SUSPENDU': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusBarColor = (status) => {
        switch (status) {
            case 'EN_COURS': return 'bg-green-500';
            case 'PLANIFIE': return 'bg-blue-500';
            case 'CLOTURE': return 'bg-gray-500';
            case 'SUSPENDU': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const getProgress = () => {
        // Mock progress based on dates or status
        if (project.statut === 'CLOTURE') return 100;
        if (project.statut === 'PLANIFIE') return 0;
        return 45; // Default mock for active
    };

    return (
        <div
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
            {/* Status Bar at Top */}
            <div className={`h-1 w-full ${getStatusBarColor(project.statut)}`}></div>

            <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                            <FolderOpen size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 line-clamp-1 text-lg group-hover:text-primary-700 transition-colors">
                                {project.nom}
                            </h3>
                            <p className="text-xs font-mono text-gray-400">{project.code}</p>
                        </div>
                    </div>
                    <div className="relative">
                        <button className="text-gray-300 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </div>

                {/* Content info */}
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 line-clamp-2 h-10 leading-snug">
                        {project.description || "Aucune description disponible pour ce projet."}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getStatusColor(project.statut)}`}>
                            {project.statut?.replace('_', ' ')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold border bg-purple-50 text-purple-700 border-purple-100 flex items-center gap-1">
                            <Users size={12} /> {project.genre_cible}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                                <Calendar size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Début</span>
                            </div>
                            <div className="text-xs font-bold text-gray-700">
                                {new Date(project.date_debut).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                                <Clock size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Durée</span>
                            </div>
                            <div className="text-xs font-bold text-gray-700">
                                {project.duree_mois} mois
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-500">
                            <span>Progression</span>
                            <span>{getProgress()}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${getProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex -space-x-1.5">
                        {project.bailleurs && Array.isArray(project.bailleurs) && project.bailleurs.slice(0, 3).map((b, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[9px] font-black text-gray-600" title={typeof b === 'string' ? b : ''}>
                                {typeof b === 'string' ? b.charAt(0) : '?'}
                            </div>
                        ))}
                        {project.bailleurs && project.bailleurs.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-400">
                                +{project.bailleurs.length - 3}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-1">
                        <button
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir détails"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            onClick={() => onEdit(project.id)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Modifier"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(project.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
