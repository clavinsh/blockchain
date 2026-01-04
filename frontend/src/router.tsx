import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyzedDataPage from './pages/AnalyzedDataPage';
import CarManagerPage from './pages/CarManagerPage';
import InvitationsPage from './pages/InvitationsPage';
import SystemInfoPage from './pages/SystemInfoPage';
import Layout from './components/Layout';

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/analyzed-data" element={<Layout><AnalyzedDataPage /></Layout>} />
        <Route path="/car-manager" element={<Layout><CarManagerPage /></Layout>} />
        <Route path="/invitations" element={<Layout><InvitationsPage /></Layout>} />
        <Route path="/system-info" element={<Layout><SystemInfoPage /></Layout>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}