import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { API_BASE_URL } from '../services/api'

export default function FilePreviewModal({ file, files, onClose, onNavigate }) {
    const [zoom, setZoom] = useState(100)
    const [loading, setLoading] = useState(true)

    if (!file) return null

    const currentIndex = files.findIndex(f => f.id === file.id)
    const canGoPrev = currentIndex > 0
    const canGoNext = currentIndex < files.length - 1

    const handlePrev = () => {
        if (canGoPrev) {
            setLoading(true)
            onNavigate(files[currentIndex - 1])
        }
    }

    const handleNext = () => {
        if (canGoNext) {
            setLoading(true)
            onNavigate(files[currentIndex + 1])
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft' && canGoPrev) handlePrev()
            if (e.key === 'ArrowRight' && canGoNext) handleNext()
        }

        window.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'unset'
        }
    }, [file, files, canGoPrev, canGoNext])

    const getFileExtension = (filename) => {
        return filename.split('.').pop().toLowerCase()
    }

    const ext = getFileExtension(file.nom_fichier)
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
    const isPDF = ext === 'pdf'
    const isWord = ['doc', 'docx'].includes(ext)

    const previewUrl = `${API_BASE_URL}/api/candidates/preview/${file.id}`
    const downloadUrl = `${API_BASE_URL}${file.chemin_fichier}`

    console.log('📂 Modal rendering:', file.nom_fichier, 'Type:', ext)

    const modalContent = (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
                padding: '20px',
                zIndex: 10
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'white'
                }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                            {file.nom_fichier}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                            {(file.taille_fichier / 1024).toFixed(2)} KB • {currentIndex + 1} / {files.length}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isImage && (
                            <>
                                <button
                                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    title="Zoom out"
                                >
                                    <ZoomOut size={20} />
                                </button>
                                <span style={{ fontSize: '14px', padding: '0 8px' }}>{zoom}%</span>
                                <button
                                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    title="Zoom in"
                                >
                                    <ZoomIn size={20} />
                                </button>
                            </>
                        )}

                        <a
                            href={downloadUrl}
                            download={file.nom_fichier}
                            style={{
                                padding: '8px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                textDecoration: 'none'
                            }}
                            title="Télécharger"
                        >
                            <Download size={20} />
                        </a>

                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Fermer"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Arrows */}
            {canGoPrev && (
                <button
                    onClick={handlePrev}
                    style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {canGoNext && (
                <button
                    onClick={handleNext}
                    style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <ChevronRight size={32} />
                </button>
            )}

            {/* Content */}
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '80px',
                paddingBottom: '40px'
            }}>
                {loading && (
                    <div style={{
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid rgba(255,255,255,0.2)',
                            borderTop: '4px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    </div>
                )}

                {isImage && (
                    <img
                        src={previewUrl}
                        alt={file.nom_fichier}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            transform: `scale(${zoom / 100})`,
                            transition: 'transform 0.2s'
                        }}
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setLoading(false)
                            console.error('Image load error')
                        }}
                    />
                )}

                {isPDF && (
                    <iframe
                        src={previewUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            backgroundColor: 'white',
                            borderRadius: '8px'
                        }}
                        onLoad={() => setLoading(false)}
                        title={file.nom_fichier}
                    />
                )}

                {isWord && (
                    <iframe
                        src={previewUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            backgroundColor: 'white',
                            borderRadius: '8px'
                        }}
                        onLoad={() => setLoading(false)}
                        title={file.nom_fichier}
                    />
                )}

                {!isImage && !isPDF && !isWord && (
                    <div style={{ textAlign: 'center', color: 'white' }}>
                        <div style={{
                            width: '96px',
                            height: '96px',
                            margin: '0 auto 16px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Download size={48} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                            Aperçu non disponible
                        </h3>
                        <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
                            Ce type de fichier ne peut pas être prévisualisé.
                        </p>
                        <a
                            href={downloadUrl}
                            download={file.nom_fichier}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: '#e74c64',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: '500'
                            }}
                        >
                            <Download size={20} />
                            Télécharger le fichier
                        </a>
                    </div>
                )}
            </div>

            {/* Keyboard hint */}
            <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px'
            }}>
                Utilisez ← → pour naviguer • ESC pour fermer
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )

    return createPortal(modalContent, document.body)
}
