import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmationModal({ isOpen, title, message, itemName, onConfirm, onCancel, isDeleting }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-red-50 p-6 flex justify-center border-b border-red-100">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center animate-bounce-slow">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title || 'Confirmer la suppression'}</h3>
                    <p className="text-gray-500 mb-4">
                        {message || 'Êtes-vous sûr de vouloir supprimer cet élément ?'}
                    </p>
                    {itemName && (
                        <div className="bg-gray-50 py-2 px-4 rounded-lg border border-gray-100 inline-block mb-4 font-medium text-gray-800 break-words max-w-full">
                            "{itemName}"
                        </div>
                    )}
                    <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                        ⚠ Cette action est irréversible.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 p-6 pt-0 bg-white">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Trash2 size={18} />
                                Supprimer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
