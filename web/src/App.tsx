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
} from 'react-router-dom';
import styles from './App.module.css';
import { Footer } from './components/Footer';
import { useAuth } from './context/AuthContext';
import CookiePage from './pages/CookiePage';
import CreateTitlePage from './pages/CreateTitlePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/PrivacyPage';
import RegisterPage from './pages/RegisterPage';
import TitlePage from './pages/TitlePage';
import VerifyEmailPage from './pages/VerifyEmailPage';

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
  const { user, authLoading } = useAuth();

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
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookies" element={<CookiePage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
