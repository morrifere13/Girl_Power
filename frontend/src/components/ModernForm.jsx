import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, MapPin, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ModernForm() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        location: ''
    })

    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    // Auto-focus premier champ au montage
    useEffect(() => {
        document.getElementById('fullName')?.focus()
    }, [])

    // Validation en temps réel
    const validateField = (name, value) => {
        switch (name) {
            case 'fullName':
                return value.length < 3 ? 'Le nom doit contenir au moins 3 caractères' : ''
            case 'email':
                return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Email invalide' : ''
            case 'phone':
                return !/^[0-9]{10}$/.test(value.replace(/\s/g, '')) ? 'Numéro invalide (10 chiffres)' : ''
            case 'password':
                return value.length < 8 ? 'Minimum 8 caractères' : ''
            case 'confirmPassword':
                return value !== formData.password ? 'Les mots de passe ne correspondent pas' : ''
            case 'location':
                return value.length < 2 ? 'Localisation requise' : ''
            default:
                return ''
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        // Validation temps réel si le champ a été touché
        if (touched[name]) {
            const error = validateField(name, value)
            setErrors(prev => ({ ...prev, [name]: error }))
        }
    }

    const handleBlur = (e) => {
        const { name, value } = e.target
        setTouched(prev => ({ ...prev, [name]: true }))
        const error = validateField(name, value)
        setErrors(prev => ({ ...prev, [name]: error }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Valider tous les champs
        const newErrors = {}
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key])
            if (error) newErrors[key] = error
        })

        setErrors(newErrors)
        setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}))

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true)

            // Simulation API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            setIsSubmitting(false)
            setSubmitSuccess(true)

            // Reset après 3 secondes
            setTimeout(() => {
                setSubmitSuccess(false)
                setFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    location: ''
                })
                setTouched({})
                setCurrentStep(1)
            }, 3000)
        }
    }

    const getFieldStatus = (name) => {
        if (!touched[name]) return 'default'
        if (errors[name]) return 'error'
        if (formData[name]) return 'success'
        return 'default'
    }

    const FormField = ({ name, label, type = 'text', icon: Icon, placeholder }) => {
        const status = getFieldStatus(name)
        const hasValue = formData[name].length > 0

        return (
            <div className="relative group">
                {/* Label flottant */}
                <label
                    htmlFor={name}
                    className={`absolute left-12 transition-all duration-300 pointer-events-none
            ${hasValue || touched[name]
                            ? '-top-3 text-xs bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold'
                            : 'top-4 text-gray-400'
                        }`}
                >
                    {label}
                </label>

                {/* Icône */}
                <div className={`absolute left-4 top-4 transition-all duration-300
          ${status === 'success' ? 'text-emerald-400' :
                        status === 'error' ? 'text-red-400' :
                            'text-gray-500 group-focus-within:text-purple-400'}`}
                >
                    <Icon size={20} />
                </div>

                {/* Input */}
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={hasValue ? '' : placeholder}
                    className={`w-full pl-12 pr-12 py-4 bg-white/5 backdrop-blur-xl border-2 rounded-2xl
            text-white placeholder-gray-500 outline-none transition-all duration-300
            ${status === 'success' ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/20' :
                            status === 'error' ? 'border-red-500/50 shadow-lg shadow-red-500/20' :
                                'border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:shadow-lg focus:shadow-purple-500/20'
                        }`}
                />

                {/* Icône de statut */}
                {touched[name] && (
                    <div className="absolute right-4 top-4 animate-scaleIn">
                        {status === 'success' && <CheckCircle size={20} className="text-emerald-400" />}
                        {status === 'error' && <AlertCircle size={20} className="text-red-400" />}
                    </div>
                )}

                {/* Message d'erreur */}
                {errors[name] && touched[name] && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2 animate-fadeIn">
                        <AlertCircle size={14} />
                        {errors[name]}
                    </p>
                )}
            </div>
        )
    }

    const progress = (Object.values(formData).filter(v => v).length / Object.keys(formData).length) * 100

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Form Container */}
            <div className="relative w-full max-w-md">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white/70">Progression</span>
                        <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-xl">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out animate-gradient"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20 relative overflow-hidden">
                    {/* Glassmorphism overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

                    {/* Header */}
                    <div className="relative mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/50 animate-float">
                            <Sparkles className="text-white" size={32} />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
                            Créer un compte
                        </h2>
                        <p className="text-gray-400">Rejoignez notre communauté dès maintenant</p>
                    </div>

                    {/* Success Message */}
                    {submitSuccess && (
                        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl backdrop-blur-xl animate-scaleIn">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <CheckCircle size={24} />
                                <div>
                                    <p className="font-semibold">Inscription réussie !</p>
                                    <p className="text-sm text-emerald-300">Bienvenue parmi nous 🎉</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="relative space-y-6">
                        <FormField
                            name="fullName"
                            label="Nom complet"
                            icon={User}
                            placeholder="John Doe"
                        />

                        <FormField
                            name="email"
                            label="Email"
                            type="email"
                            icon={Mail}
                            placeholder="john@example.com"
                        />

                        <FormField
                            name="phone"
                            label="Téléphone"
                            type="tel"
                            icon={Phone}
                            placeholder="0612345678"
                        />

                        <FormField
                            name="location"
                            label="Localisation"
                            icon={MapPin}
                            placeholder="Paris, France"
                        />

                        <FormField
                            name="password"
                            label="Mot de passe"
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                        />

                        <FormField
                            name="confirmPassword"
                            label="Confirmer le mot de passe"
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || submitSuccess}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 
                text-white font-bold rounded-2xl shadow-lg shadow-purple-500/50
                hover:shadow-xl hover:shadow-purple-500/60 hover:scale-[1.02]
                active:scale-[0.98] transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                relative overflow-hidden group"
                        >
                            {/* Button gradient animation */}
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <span className="relative flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Création en cours...
                                    </>
                                ) : submitSuccess ? (
                                    <>
                                        <CheckCircle size={20} />
                                        Compte créé !
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Créer mon compte
                                    </>
                                )}
                            </span>
                        </button>

                        {/* Footer */}
                        <p className="text-center text-sm text-gray-400 mt-6">
                            Déjà un compte ?{' '}
                            <button
                                type="button"
                                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                            >
                                Se connecter
                            </button>
                        </p>
                    </form>
                </div>

                {/* Decorative elements */}
                <div className="absolute -z-10 top-0 left-0 w-full h-full">
                    <div className="absolute top-10 right-10 w-20 h-20 border-2 border-purple-500/30 rounded-full animate-ping"></div>
                    <div className="absolute bottom-10 left-10 w-16 h-16 border-2 border-pink-500/30 rounded-full animate-ping delay-500"></div>
                </div>
            </div>

            {/* Custom animations CSS */}
            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
        </div>
    )
}
