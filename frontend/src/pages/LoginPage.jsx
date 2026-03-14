import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-brand">
          <div className="auth-brand__logo">CGI</div>
          <div className="auth-brand__title">Plateforme CV</div>
          <div className="auth-brand__sub">Connectez-vous à votre espace consultant</div>
        </div>

        <div className="card card--lg">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="field">
              <label className="label">Adresse email</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>

            <div className="field">
              <label className="label">Mot de passe</label>
              <div className="input-wrap">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="input-wrap__btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn--primary btn--full btn--lg"
              style={{ marginTop: 24 }}
            >
              {loading ? <><span className="spinner spinner--sm spinner--white" /> Connexion...</> : 'Se connecter'}
            </button>
          </form>

          <div className="auth-footer">
            Pas encore de compte ?{' '}
            <Link to="/register">Créer un compte</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
