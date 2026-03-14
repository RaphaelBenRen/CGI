import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { History, Upload, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/dashboard" className="navbar__brand">
          <span className="navbar__logo">CGI</span>
          <span className="navbar__name">Plateforme CV</span>
        </Link>

        {user && (
          <div className="navbar__links">
            <Link
              to="/dashboard"
              className={`nav-link${isActive('/dashboard') ? ' nav-link--active' : ''}`}
            >
              <History size={14} />
              Historique
            </Link>

            <Link
              to="/upload"
              className={`nav-link${isActive('/upload') ? ' nav-link--active' : ''}`}
            >
              <Upload size={14} />
              Nouveau CV
            </Link>

            <span className="navbar__sep" />

            <span className="navbar__user">
              <User size={13} />
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              className="nav-link nav-link--danger"
              style={{ background: 'none', border: '1px solid transparent' }}
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
