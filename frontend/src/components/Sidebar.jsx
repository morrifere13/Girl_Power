import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  BarChart3,
  Download,
  Upload,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  School,
  Briefcase,
  Stethoscope,
  BookOpen,
  MapPin,
  ClipboardCheck,
  GraduationCap,
  Settings,
  HeartPulse,
  UserCheck,
  Layers,
  TrendingUp
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../services/api'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openSections, setOpenSections] = useState({})
  const [hoveredItem, setHoveredItem] = useState(null)
  const { user, logout } = useAuth()
  const location = useLocation()
  const tooltipTimeout = useRef(null)

  // Auto-expand section containing active route
  useEffect(() => {
    const currentPath = location.pathname
    menuGroups.forEach((group) => {
      const hasActiveItem = group.items.some(item =>
        currentPath === item.path || currentPath.startsWith(item.path + '/')
      )
      if (hasActiveItem) {
        setOpenSections(prev => ({ ...prev, [group.id]: true }))
      }
    })
  }, [location.pathname])

  const handleLogout = () => {
    if (confirm('Voulez-vous vous deconnecter ?')) {
      logout()
    }
  }

  const toggleSection = (sectionId) => {
    if (isCollapsed) return
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Menu restructure par flux logique du parcours recrutement
  const menuGroups = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      color: 'slate',
      collapsible: false,
      items: [
        {
          title: 'Vue d\'ensemble',
          icon: LayoutDashboard,
          path: '/',
        }
      ]
    },
    {
      id: 'configuration',
      label: 'Configuration',
      icon: Settings,
      color: 'blue',
      collapsible: true,
      items: [
        {
          title: 'Centres de formation',
          icon: Building2,
          path: '/centres',
          description: 'Gerer les centres'
        },
        {
          title: 'Projets',
          icon: FolderOpen,
          path: '/projects',
          description: 'Gerer les projets'
        },
        {
          title: 'Cohortes',
          icon: School,
          path: '/cohortes',
          description: 'Gerer les cohortes'
        }
      ]
    },
    {
      id: 'recrutement',
      label: 'Recrutement',
      icon: UserPlus,
      color: 'amber',
      collapsible: true,
      items: [
        {
          title: 'Liste des candidates',
          icon: Users,
          path: '/candidates',
        },
        {
          title: 'Nouvelle inscription',
          icon: UserPlus,
          path: '/candidates/new',
        },
        {
          title: 'Validation',
          icon: ClipboardCheck,
          path: '/validation-dashboard',
        }
      ]
    },
    {
      id: 'medical',
      label: 'Suivi medical',
      icon: HeartPulse,
      color: 'rose',
      collapsible: true,
      items: [
        {
          title: 'Candidats a examiner',
          icon: UserCheck,
          path: '/visites-medicales/candidats',
        },
        {
          title: 'Visites medicales',
          icon: Stethoscope,
          path: '/visites-medicales',
        }
      ]
    },
    {
      id: 'formation',
      label: 'Formation',
      icon: GraduationCap,
      color: 'emerald',
      collapsible: true,
      items: [
        {
          title: 'Suivi formations',
          icon: BookOpen,
          path: '/formations',
        }
      ]
    },
    {
      id: 'insertion',
      label: 'Insertion pro',
      icon: Briefcase,
      color: 'violet',
      collapsible: true,
      items: [
        {
          title: 'Entreprises',
          icon: Building2,
          path: '/entreprises',
        },
        {
          title: 'Stages & missions',
          icon: Briefcase,
          path: '/stages',
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Statistiques',
      icon: TrendingUp,
      color: 'cyan',
      collapsible: false,
      items: [
        {
          title: 'Analytics',
          icon: BarChart3,
          path: '/statistics',
        }
      ]
    }
  ]

  // Ajouter les items admin
  if (user?.role === 'admin') {
    menuGroups.push({
      id: 'admin',
      label: 'Administration',
      icon: ShieldCheck,
      color: 'red',
      collapsible: true,
      items: [
        {
          title: 'Utilisateurs',
          icon: ShieldCheck,
          path: '/users',
        },
        {
          title: 'Audit & logs',
          icon: ShieldAlert,
          path: '/audit',
        }
      ]
    })
  }

  const colorMap = {
    slate: {
      active: 'bg-slate-900 text-white',
      hover: 'hover:bg-slate-50',
      text: 'text-slate-600',
      accent: 'bg-slate-900',
      label: 'text-slate-500',
      dot: 'bg-slate-400',
      lightBg: 'bg-slate-50',
      border: 'border-slate-200'
    },
    blue: {
      active: 'bg-blue-600 text-white',
      hover: 'hover:bg-blue-50',
      text: 'text-blue-600',
      accent: 'bg-blue-600',
      label: 'text-blue-600',
      dot: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    amber: {
      active: 'bg-amber-500 text-white',
      hover: 'hover:bg-amber-50',
      text: 'text-amber-600',
      accent: 'bg-amber-500',
      label: 'text-amber-600',
      dot: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    rose: {
      active: 'bg-rose-500 text-white',
      hover: 'hover:bg-rose-50',
      text: 'text-rose-600',
      accent: 'bg-rose-500',
      label: 'text-rose-600',
      dot: 'bg-rose-500',
      lightBg: 'bg-rose-50',
      border: 'border-rose-100'
    },
    emerald: {
      active: 'bg-emerald-600 text-white',
      hover: 'hover:bg-emerald-50',
      text: 'text-emerald-600',
      accent: 'bg-emerald-600',
      label: 'text-emerald-600',
      dot: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    violet: {
      active: 'bg-violet-600 text-white',
      hover: 'hover:bg-violet-50',
      text: 'text-violet-600',
      accent: 'bg-violet-600',
      label: 'text-violet-600',
      dot: 'bg-violet-500',
      lightBg: 'bg-violet-50',
      border: 'border-violet-100'
    },
    cyan: {
      active: 'bg-cyan-600 text-white',
      hover: 'hover:bg-cyan-50',
      text: 'text-cyan-600',
      accent: 'bg-cyan-600',
      label: 'text-cyan-600',
      dot: 'bg-cyan-500',
      lightBg: 'bg-cyan-50',
      border: 'border-cyan-100'
    },
    red: {
      active: 'bg-red-600 text-white',
      hover: 'hover:bg-red-50',
      text: 'text-red-600',
      accent: 'bg-red-600',
      label: 'text-red-600',
      dot: 'bg-red-500',
      lightBg: 'bg-red-50',
      border: 'border-red-100'
    }
  }

  const isItemActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const isSectionActive = (group) => {
    return group.items.some(item => isItemActive(item.path))
  }

  // Indicateur du parcours recrutement (etapes)
  const workflowSteps = [
    { id: 'configuration', label: 'Config', num: 1 },
    { id: 'recrutement', label: 'Recrut.', num: 2 },
    { id: 'medical', label: 'Medical', num: 3 },
    { id: 'formation', label: 'Form.', num: 4 },
    { id: 'insertion', label: 'Insert.', num: 5 },
  ]

  const currentStepIndex = workflowSteps.findIndex(step =>
    menuGroups.find(g => g.id === step.id)?.items.some(item => isItemActive(item.path))
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center h-16 border-b border-neutral-100 bg-white shrink-0 ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Girl Power
              </h1>
              <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                Plateforme 2026
              </span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-neutral-200 rounded-full shadow-sm flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:shadow transition-all z-50 hidden lg:flex"
      >
        {isCollapsed ? <ChevronRight size={12} strokeWidth={2.5} /> : <ChevronLeft size={12} strokeWidth={2.5} />}
      </button>

      {/* Workflow progress bar (expanded only) */}
      {!isCollapsed && (
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Parcours</span>
          </div>
          <div className="flex items-center gap-1">
            {workflowSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                    idx <= currentStepIndex && currentStepIndex >= 0
                      ? 'bg-emerald-500'
                      : 'bg-neutral-200'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {workflowSteps.map((step, idx) => (
              <span
                key={step.id}
                className={`text-[8px] font-medium ${
                  idx <= currentStepIndex && currentStepIndex >= 0
                    ? 'text-emerald-600'
                    : 'text-neutral-300'
                }`}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
        {menuGroups.map((group) => {
          const colors = colorMap[group.color]
          const sectionActive = isSectionActive(group)
          const isOpen = openSections[group.id] !== false // default open
          const GroupIcon = group.icon

          // Non-collapsible single items (dashboard, analytics)
          if (!group.collapsible) {
            const item = group.items[0]
            const active = isItemActive(item.path)
            return (
              <div key={group.id} className="relative">
                <NavLink
                  to={item.path}
                  className={`group relative flex items-center rounded-lg transition-all duration-200 ${
                    isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 gap-3'
                  } ${active ? colors.active + ' shadow-sm' : 'text-neutral-500 ' + colors.hover + ' hover:text-neutral-700'}`}
                  onClick={() => setIsMobileOpen(false)}
                  onMouseEnter={() => isCollapsed && setHoveredItem(group.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <item.icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                  {!isCollapsed && (
                    <span className={`text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>
                      {item.title}
                    </span>
                  )}
                </NavLink>
                {/* Tooltip collapsed */}
                {isCollapsed && hoveredItem === group.id && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg whitespace-nowrap z-[100] shadow-lg">
                    {item.title}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
                  </div>
                )}
              </div>
            )
          }

          // Collapsible sections
          return (
            <div key={group.id}>
              {/* Section header */}
              <button
                onClick={() => !isCollapsed && toggleSection(group.id)}
                onMouseEnter={() => isCollapsed && setHoveredItem(group.id + '-header')}
                onMouseLeave={() => setHoveredItem(null)}
                className={`relative w-full flex items-center rounded-lg transition-all duration-200 ${
                  isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
                } ${
                  sectionActive && isCollapsed
                    ? colors.lightBg + ' ' + colors.text
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <GroupIcon size={18} strokeWidth={2} className={`shrink-0 ${sectionActive ? colors.text : ''}`} />
                {!isCollapsed && (
                  <>
                    <span className={`text-[11px] font-bold uppercase tracking-wider flex-1 text-left ${
                      sectionActive ? colors.label : 'text-neutral-400'
                    }`}>
                      {group.label}
                    </span>
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'} ${
                        sectionActive ? colors.text : 'text-neutral-300'
                      }`}
                    />
                  </>
                )}
                {/* Active section indicator for collapsed */}
                {sectionActive && isCollapsed && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 ${colors.accent} rounded-r-full`} />
                )}
              </button>

              {/* Tooltip for collapsed section headers */}
              {isCollapsed && hoveredItem === group.id + '-header' && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg whitespace-nowrap z-[100] shadow-lg" style={{ marginTop: '-28px' }}>
                  {group.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
                </div>
              )}

              {/* Section items */}
              {!isCollapsed && (
                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isOpen ? 'max-h-96 opacity-100 mt-0.5' : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-4 pl-3 border-l-2 border-neutral-100 space-y-0.5">
                    {group.items.map((item) => {
                      const active = isItemActive(item.path)
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 ${
                            active
                              ? colors.active + ' shadow-sm'
                              : 'text-neutral-500 ' + colors.hover + ' hover:text-neutral-700'
                          }`}
                          onClick={() => setIsMobileOpen(false)}
                        >
                          <item.icon size={16} strokeWidth={active ? 2.5 : 1.8} className="shrink-0" />
                          <span className={`text-[13px] ${active ? 'font-semibold' : 'font-normal'}`}>
                            {item.title}
                          </span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Collapsed: show items as individual icons in a popover on hover */}
              {isCollapsed && hoveredItem === group.id + '-header' && (
                <div
                  className="absolute left-full top-0 ml-3 bg-white border border-neutral-200 rounded-xl shadow-xl z-[100] py-2 px-1 min-w-[200px]"
                  onMouseEnter={() => setHoveredItem(group.id + '-header')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={`px-3 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider ${colors.label}`}>
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const active = isItemActive(item.path)
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mx-1 transition-all duration-150 ${
                          active
                            ? colors.active + ' shadow-sm'
                            : 'text-neutral-600 ' + colors.hover + ' hover:text-neutral-800'
                        }`}
                        onClick={() => {
                          setIsMobileOpen(false)
                          setHoveredItem(null)
                        }}
                      >
                        <item.icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                        <span className={`text-[13px] ${active ? 'font-semibold' : 'font-normal'}`}>
                          {item.title}
                        </span>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-neutral-100 bg-white">
        {/* Quick actions */}
        {!isCollapsed ? (
          <div className="flex gap-1.5 px-3 pt-3 pb-2">
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = `${API_BASE_URL}/api/export/excel`
                link.download = 'candidates.xlsx'
                link.click()
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs font-medium"
              title="Exporter Excel"
            >
              <Download size={14} strokeWidth={2} />
              Export
            </button>
            <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer text-xs font-medium">
              <Upload size={14} strokeWidth={2} />
              Import
              <input type="file" className="hidden" accept=".xlsx,.xls" />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-2 pt-3 pb-2 items-center">
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = `${API_BASE_URL}/api/export/excel`
                link.download = 'candidates.xlsx'
                link.click()
              }}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
              title="Exporter"
            >
              <Download size={15} strokeWidth={2} />
            </button>
            <label className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer" title="Importer">
              <Upload size={15} strokeWidth={2} />
              <input type="file" className="hidden" accept=".xlsx,.xls" />
            </label>
          </div>
        )}

        {/* User info + Logout */}
        <div className={`px-3 pb-3 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          <div className={`flex items-center rounded-xl bg-neutral-50 ${isCollapsed ? 'p-2 justify-center' : 'p-2.5 gap-3 mb-2'}`}>
            <div className={`shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
              user?.role === 'admin'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : user?.role === 'gestionnaire'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : 'bg-gradient-to-br from-neutral-600 to-neutral-700'
            } ${isCollapsed ? 'w-9 h-9' : 'w-9 h-9'}`}>
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-800 truncate leading-tight">
                  {user?.prenom} {user?.nom}
                </p>
                <span className={`inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  user?.role === 'admin'
                    ? 'bg-red-100 text-red-700'
                    : user?.role === 'gestionnaire'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {user?.role}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 ${
              isCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'
            }`}
            title="Se deconnecter"
          >
            <LogOut size={16} strokeWidth={2} />
            {!isCollapsed && <span className="text-xs font-medium">Se deconnecter</span>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-neutral-200/80 transition-all duration-300 ease-in-out z-40 no-print hidden lg:flex flex-col ${
          isCollapsed ? 'w-[72px]' : 'w-[270px]'
        }`}
        style={{ boxShadow: '1px 0 3px rgba(0,0,0,0.03)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-neutral-200/80 z-40 flex items-center justify-between px-4 no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="font-bold text-neutral-900 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Girl Power
          </span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-screen w-[270px] bg-white z-50 flex flex-col lg:hidden border-r border-neutral-200/80 shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
