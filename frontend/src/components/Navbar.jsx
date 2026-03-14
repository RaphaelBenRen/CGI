import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, History, Upload, LogOut, User } from 'lucide-react';

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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="bg-blue-700 text-white font-bold text-lg px-3 py-1 rounded">CGI</div>
            <span className="text-slate-700 font-semibold text-sm hidden sm:block">
              Plateforme CV
            </span>
          </Link>

          {/* Navigation */}
          {user && (
            <div className="flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History size={16} />
                <span className="hidden sm:block">Historique</span>
              </Link>

              <Link
                to="/upload"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/upload')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Upload size={16} />
                <span className="hidden sm:block">Nouveau CV</span>
              </Link>

              <div className="ml-2 h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-2 px-3 py-2">
                <User size={16} className="text-slate-400" />
                <span className="text-slate-600 text-sm hidden md:block truncate max-w-32">
                  {user.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:block">Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
