import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { FontProvider } from "./contexts/FontContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ManageProjectOptionsPage from "./pages/ManageProjectOptionsPage";
import ProjectStatusPage from "./pages/ProjectStatusPage";
import AddProjectOptionPage from "./pages/AddProjectOptionPage";
import AddProjectStatusPage from "./pages/AddProjectStatusPage";
import ConstructionPage from "./pages/ConstructionPage";
import WorkforcePage from "./pages/WorkforcePage";
import MaterialsPage from "./pages/MaterialsPage";
import AttendancePage from "./pages/AttendancePage";
import DailyLogPage from "./pages/DailyLogPage";
import ReportsPage from "./pages/ReportsPage";
import DocumentsPage from "./pages/DocumentsPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import ClientRequestsPage from "./pages/ClientRequestsPage";
import FinancialPage from "./pages/FinancialPage";
import TeamPage from "./pages/TeamPage";

const ADMIN = ["admin"];
const ADMIN_ENGINEER = ["admin", "engineer"];
const ADMIN_CLIENT = ["admin", "client"];
const CLIENT = ["client"];
const ALL_ROLES = ["admin", "engineer", "client"];

function HomeRedirect() {
  const { homeRoute } = useAuth();
  return <Navigate to={homeRoute} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <FontProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                  element={
                    <ProtectedRoute roles={ALL_ROLES}>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="/projects"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <ProjectsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/status"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <ProjectStatusPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/options"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <ManageProjectOptionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/options/types/new"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <AddProjectOptionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/options/statuses/new"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <AddProjectStatusPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/:projectId"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <ProjectDetailPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/construction"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <ConstructionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/construction/:projectId"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <ConstructionPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/workforce"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <WorkforcePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/team"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <TeamPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/materials"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <MaterialsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/materials/:projectId"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <MaterialsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <AttendancePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/attendance/:projectId"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <AttendancePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/daily-log"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <DailyLogPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/daily-log/:projectId"
                    element={
                      <ProtectedRoute roles={ADMIN_ENGINEER}>
                        <DailyLogPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <ReportsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/documents"
                    element={
                      <ProtectedRoute roles={ALL_ROLES}>
                        <DocumentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/documents/:projectId"
                    element={
                      <ProtectedRoute roles={ALL_ROLES}>
                        <DocumentsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/client-dashboard"
                    element={
                      <ProtectedRoute roles={CLIENT}>
                        <ClientDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/client-dashboard/:projectId"
                    element={
                      <ProtectedRoute roles={CLIENT}>
                        <ClientDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/requests"
                    element={
                      <ProtectedRoute roles={ADMIN}>
                        <ClientRequestsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/financial"
                    element={
                      <ProtectedRoute roles={ADMIN_CLIENT}>
                        <FinancialPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/financial/:projectId"
                    element={
                      <ProtectedRoute roles={ADMIN_CLIENT}>
                        <FinancialPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route
                  path="/"
                  element={
                    <ProtectedRoute roles={ALL_ROLES}>
                      <HomeRedirect />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
