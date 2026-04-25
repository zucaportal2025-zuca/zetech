import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import RoleRoute from "./components/RoleRoute";
import JumuiaRoute from "./components/routing/JumuiaRoute";
import Landing2 from "./pages/landing2";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Announcements from "./pages/Announcements";
import MassPrograms from "./pages/MassPrograms";
import Contributions from "./pages/Contributions";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import HymnBook from './pages/HymnBook';
import HymnLyrics from './pages/HymnLyrics';
import LiturgicalCalendar from './pages/LiturgicalCalendar';
import JumuiaDashboard from "./pages/JumuiaDashboard";
import JoinJumuia from "./pages/JoinJumuia";
import JumuiaDetailPage from "./pages/jumuia/JumuiaDetailPage";
import FullReadings from './pages/FullReadings';
import GalleryPage from "./pages/gallery";

/* ===== ADMIN IMPORTS ===== */
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMediaPage from "./pages/admin/MediaPage";
import UsersPage from "./pages/admin/UsersPage";
import RoleManagement from "./pages/admin/RoleManagement";
import ActivityPage from "./pages/admin/ActivityPage";
import YoutubeAnalyticsPage from './pages/admin/YoutubeAnalyticsPage';
import SongsPage from "./pages/admin/SongsPage";
import AdminHymns from './pages/admin/Hymns';
import AnnouncementsPage from "./pages/admin/AnnouncementsPage";
import ContributionsPage from "./pages/admin/ContributionsPage";
import JumuiaManagement from "./pages/admin/JumuiaManagement";
import ChatMonitorPage from "./pages/admin/ChatMonitorPage";
import SecurityPage from "./pages/admin/SecurityPage";

/* ===== ROLE LAYOUT ===== */
import RoleLayout from "./pages/role/RoleLayout";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= LANDING PAGE ================= */}
        <Route path="/" element={<Landing2 />} />

        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/home" element={<Home />} />
        <Route path="/readings/:date" element={<FullReadings />} />
        <Route path="/liturgical-calendar" element={<LiturgicalCalendar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= MEMBER PORTAL ================= */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/mass-programs" element={<MassPrograms />} />
          <Route path="/contributions" element={<Contributions />} />
          
          <Route path="/jumuia-contributions" element={<JumuiaDashboard />} />          
          <Route path="/join-jumuia" element={<JoinJumuia />} />
          <Route path="/hymns" element={<HymnBook />} />
          <Route path="/hymn/:id" element={<HymnLyrics />} />
          <Route path="/chat" element={<Chat />} />
        </Route>

        {/* ================= JUMUIA DETAIL PAGE ================= */}
        <Route
          path="/jumuia/:jumuiaCode"
          element={
            <ProtectedRoute>
              <JumuiaRoute>
                <JumuiaDetailPage />
              </JumuiaRoute>
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN PORTAL (Full Access) ================= */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="/admin/analytics" element={<YoutubeAnalyticsPage />} />
          <Route path="songs" element={<SongsPage />} />
          <Route path="/admin/hymns" element={<AdminHymns />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="contributions" element={<ContributionsPage />} />
          <Route path="jumuia-management" element={<JumuiaManagement />} />
          <Route path="chat" element={<ChatMonitorPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="media" element={<AdminMediaPage />} />
        </Route>

        {/* ================= SECRETARY (Announcements only) ================= */}
        <Route
          path="/secretary"
          element={
            <RoleRoute allowedRoles={["secretary"]}>
              <RoleLayout />
            </RoleRoute>
          }
        >
          <Route index element={<Navigate to="announcements" replace />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        {/* ================= TREASURER (Contributions only) ================= */}
        <Route
          path="/treasurer"
          element={
            <RoleRoute allowedRoles={["treasurer"]}>
              <RoleLayout />
            </RoleRoute>
          }
        >
          <Route index element={<Navigate to="contributions" replace />} />
          <Route path="contributions" element={<ContributionsPage />} />
        </Route>

        {/* ================= CHOIR MODERATOR (Songs only) ================= */}
        <Route
          path="/choir"
          element={
            <RoleRoute allowedRoles={["choir_moderator"]}>
              <RoleLayout />
            </RoleRoute>
          }
        >
          <Route index element={<Navigate to="songs" replace />} />
          <Route path="songs" element={<SongsPage />} />
        </Route>

        {/* ================= JUMUIA LEADER (Single dashboard page) ================= */}
        <Route
          path="/leader"
          element={
            <RoleRoute allowedRoles={["jumuia_leader"]}>
              <RoleLayout />
            </RoleRoute>
          }
        >
          <Route index element={<JumuiaManagement />} />
        </Route>

        {/* ================= MEDIA MODERATOR (Media management only) ================= */}
        <Route
  path="/media-moderator"
  element={
    <RoleRoute allowedRoles={["media_moderator"]}>
      <RoleLayout />
    </RoleRoute>
  }
>
          <Route index element={<Navigate to="media" replace />} />
          <Route path="media" element={<AdminMediaPage />} />
        </Route>

        {/* ================= CATCH ALL ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;