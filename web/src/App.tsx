import {
  BookOpen,
  Clapperboard,
  Film,
  Gamepad,
  Gamepad2,
  Star,
} from 'lucide-react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router';
import styles from './App.module.css';
import { Footer } from './components/layout/Footer';
import { useAuth } from './context/AuthContext';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminPage from './pages/admin/AdminPage';
import AdminUserPage from './pages/admin/AdminUserPage';
import DemoPage from './pages/auth/DemoPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import CreateTitlePage from './pages/CreateTitlePage';
import HomePage from './pages/HomePage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import TitlePage from './pages/TitlePage';

const ambientIcons = [
  { name: 'film', Icon: Film },
  { name: 'game', Icon: Gamepad },
  { name: 'book', Icon: BookOpen },
  { name: 'clapperboard', Icon: Clapperboard },
  { name: 'star', Icon: Star },
  { name: 'gamepad', Icon: Gamepad2 },
];

function AmbientBackground() {
  return (
    <div className={styles.ambient} aria-hidden="true">
      {ambientIcons.map(({ name, Icon }, index) => (
        <Icon
          key={name}
          className={`${styles.symbol} ${styles[`symbol${index + 1}`]}`}
          strokeWidth={1.1}
        />
      ))}
    </div>
  );
}

function RedirectAfterAuth() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  return <Navigate to={from} replace />;
}

export default function App() {
  const { user, authLoading, adminMode } = useAuth();

  if (authLoading) return <div className={styles.loading}>Loading...</div>;

  return (
    <BrowserRouter>
      <AmbientBackground />
      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={user ? <RedirectAfterAuth /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={user ? <RedirectAfterAuth /> : <RegisterPage />}
          />
          <Route path="/titles/:id" element={<TitlePage />} />
          <Route
            path="/titles/new"
            element={user ? <CreateTitlePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={adminMode ? <AdminPage /> : <NotFoundPage />}
          />
          <Route
            path="/admin/analytics"
            element={adminMode ? <AdminAnalyticsPage /> : <NotFoundPage />}
          />
          <Route
            path="/admin/users/:id"
            element={adminMode ? <AdminUserPage /> : <NotFoundPage />}
          />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/demo" element={<DemoPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
