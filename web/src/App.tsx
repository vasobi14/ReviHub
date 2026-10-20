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
import { Footer } from './components/Footer';
import { useAuth } from './context/AuthContext';
import CookiePage from './pages/CookiePage';
import CreateWorkPage from './pages/CreateWorkPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/PrivacyPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import WorkPage from './pages/WorkPage';

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
    <div className="ambient-background" aria-hidden="true">
      {ambientIcons.map(({ name, Icon }, index) => (
        <Icon
          key={name}
          className={`ambient-symbol ambient-symbol-${index + 1}`}
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

  if (authLoading) return <div className="loading-state">Loading...</div>;

  return (
    <BrowserRouter>
      <AmbientBackground />
      <div className="app-content">
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
          <Route path="/works/:id" element={<WorkPage />} />
          <Route
            path="/works/new"
            element={user ? <CreateWorkPage /> : <Navigate to="/login" />}
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
