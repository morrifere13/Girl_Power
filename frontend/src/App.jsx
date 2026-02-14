import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import CandidatesList from './pages/CandidatesList'
import CandidateForm from './pages/CandidateFormV3'
import CandidateDetails from './pages/CandidateDetails'
import Statistics from './pages/Statistics'
import AuditLogs from './pages/AuditLogs'
import Users from './pages/Users'
import Login from './pages/Login'
import ModernForm from './components/ModernForm'
import CentresList from './pages/CentresList'
import CentreForm from './pages/CentreForm'
import ProjectsList from './pages/ProjectsList'
import ProjectForm from './pages/ProjectForm'
import ProjectDetail from './pages/ProjectDetail'
import CentreDetail from './pages/CentreDetail'
import CohortesList from './pages/CohortesList'
import CohorteForm from './pages/CohorteForm'
import CohorteDetail from './pages/CohorteDetail'
import VisitesMedicalesPage from './pages/VisitesMedicalesPage'
import VisiteMedicaleForm from './pages/VisiteMedicaleFormComplete'
import CandidatsVisiteMedicale from './pages/CandidatsVisiteMedicale'
import ValidationDashboard from './pages/ValidationDashboard'
import EntreprisesList from './pages/EntreprisesList'
import EntrepriseForm from './pages/EntrepriseForm'
import EntrepriseDetails from './pages/EntrepriseDetails'
import StagesList from './pages/StagesList'
import StageForm from './pages/StageForm'
import StageDetails from './pages/StageDetails'
import FormationDashboard from './pages/FormationDashboard'
import DossierCandidat from './pages/DossierCandidat'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            {/* Public Route - Login */}
            <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
                  {/* Toast Notifications */}
                  <Toaster
                    position="top-right"
                    reverseOrder={false}
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#fff',
                        color: '#363636',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      },
                      success: {
                        iconTheme: {
                          primary: '#10b981',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />

                  {/* Sidebar */}
                  <Sidebar />

                  {/* Main Content */}
                  <main className="lg:ml-[270px] min-h-screen pt-16 lg:pt-0 pb-12 transition-all duration-300">
                    <div className="px-4 lg:px-8 py-8">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/candidates" element={<CandidatesList />} />
                        <Route
                          path="/candidates/new"
                          element={
                            <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                              <CandidateForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/candidates/:id" element={<CandidateDetails />} />
                        <Route
                          path="/candidates/:id/edit"
                          element={
                            <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                              <CandidateForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/statistics" element={<Statistics />} />
                        <Route path="/centres" element={<CentresList />} />
                        <Route path="/projects" element={<ProjectsList />} />
                        <Route path="/projects/new" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <ProjectForm />
                          </ProtectedRoute>
                        }
                        />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                        <Route
                          path="/projects/:id/edit"
                          element={
                            <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                              <ProjectForm />
                            </ProtectedRoute>
                          }
                        />

                        {/* Cohortes Routes */}
                        <Route path="/cohortes" element={<CohortesList />} />
                        <Route path="/cohortes/new" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <CohorteForm />
                          </ProtectedRoute>
                        } />
                        <Route path="/cohortes/:id" element={<CohorteDetail />} />
                        <Route path="/cohortes/:id/edit" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <CohorteForm />
                          </ProtectedRoute>
                        } />

                        {/* Visites Médicales Routes */}
                        <Route path="/visites-medicales" element={<VisitesMedicalesPage />} />
                        <Route path="/visites-medicales/candidats" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <CandidatsVisiteMedicale />
                          </ProtectedRoute>
                        } />
                        <Route path="/visites-medicales/new" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <VisiteMedicaleForm />
                          </ProtectedRoute>
                        } />
                        <Route path="/visites-medicales/new/:candidateId" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <VisiteMedicaleForm />
                          </ProtectedRoute>
                        } />
                        <Route path="/visites-medicales/:id" element={<VisiteMedicaleForm />} />
                        <Route path="/visites-medicales/:id/edit" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <VisiteMedicaleForm />
                          </ProtectedRoute>
                        } />

                        {/* Validation Routes */}
                        <Route path="/validation-dashboard" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <ValidationDashboard />
                          </ProtectedRoute>
                        } />

                        {/* Entreprises Routes */}
                        <Route path="/entreprises" element={<EntreprisesList />} />
                        <Route path="/entreprises/new" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <EntrepriseForm />
                          </ProtectedRoute>
                        } />
                        <Route path="/entreprises/:id" element={<EntrepriseDetails />} />
                        <Route path="/entreprises/:id/edit" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <EntrepriseForm />
                          </ProtectedRoute>
                        } />

                        {/* Formations Routes */}
                        <Route path="/formations" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <FormationDashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/dossier/:id" element={<DossierCandidat />} />
                        <Route path="/parcours/:id" element={<DossierCandidat />} />

                        {/* Stages Routes */}
                        <Route path="/stages" element={<StagesList />} />
                        <Route path="/stages/new" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <StageForm />
                          </ProtectedRoute>
                        } />
                        <Route path="/stages/:id" element={<StageDetails />} />
                        <Route path="/stages/:id/edit" element={
                          <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                            <StageForm />
                          </ProtectedRoute>
                        } />

                        <Route
                          path="/centres/new"
                          element={
                            <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                              <CentreForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/centres/:id" element={<CentreDetail />} />
                        <Route
                          path="/centres/:id/edit"
                          element={
                            <ProtectedRoute allowedRoles={['admin', 'gestionnaire']}>
                              <CentreForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/demo-form" element={<ModernForm />} />
                        <Route
                          path="/users"
                          element={
                            <ProtectedRoute allowedRoles={['admin']}>
                              <Users />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/audit"
                          element={
                            <ProtectedRoute allowedRoles={['admin']}>
                              <AuditLogs />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </div>
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ProjectProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

