import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas.');
    if (form.password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.full_name);
      setSuccess('Compte créé ! Vérifiez votre email pour valider votre compte.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-brand">
          <div className="auth-brand__logo">CGI</div>
          <div className="auth-brand__title">Créer un compte</div>
          <div className="auth-brand__sub">Rejoignez la plateforme CV CGI</div>
        </div>

        <div className="card card--lg">
          <form onSubmit={handleSubmit}>
            {error   && <div className="alert alert--error"   style={{ marginBottom: 16 }}>{error}</div>}
            {success && <div className="alert alert--success" style={{ marginBottom: 16 }}>{success}</div>}

            <div className="field">
              <label className="label">Nom complet</label>
              <input className="input" type="text" name="full_name" required value={form.full_name} onChange={handleChange} placeholder="Jean Dupont" />
            </div>

            <div className="field">
              <label className="label">Adresse email</label>
              <input className="input" type="email" name="email" required value={form.email} onChange={handleChange} placeholder="votre@email.com" />
            </div>

            <div className="field">
              <label className="label">Mot de passe</label>
              <div className="input-wrap">
                <input className="input" type={showPassword ? 'text' : 'password'} name="password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
                <button type="button" className="input-wrap__btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="field">
              <label className="label">Confirmer le mot de passe</label>
              <input className="input" type="password" name="confirm" required value={form.confirm} onChange={handleChange} placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="btn btn--primary btn--full btn--lg" style={{ marginTop: 24 }}>
              {loading ? <><span className="spinner spinner--sm spinner--white" /> Création...</> : 'Créer mon compte'}
            </button>
          </form>

          <div className="auth-footer">
            Déjà un compte ?{' '}
            <Link to="/login">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
