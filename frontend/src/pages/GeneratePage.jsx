import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { cvApi } from '../services/api';
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

export default function GeneratePage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'update';

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const hasStarted = useRef(false);

  const steps = [
    'Lecture de votre CV…',
    'Extraction des informations…',
    'Analyse des compétences…',
    "Génération des propositions avec l'IA…",
    'Finalisation…',
  ];

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const intervalId = { current: null };

    async function startGeneration() {
      setStatus('generating');
      intervalId.current = setInterval(() => {
        setStep((s) => (s < steps.length - 1 ? s + 1 : s));
      }, 3000);
      try {
        await cvApi.generate(sessionId, { mode });
        clearInterval(intervalId.current);
        setStatus('done');
        setTimeout(() => navigate(`/session/${sessionId}`), 1000);
      } catch (err) {
        clearInterval(intervalId.current);
        setError(err.response?.data?.error || 'Erreur lors de la génération.');
        setStatus('error');
      }
    }

    startGeneration();
  }, [sessionId]);

  return (
    <div className="generate-page">
      <div className="generate-box">
        {status === 'generating' && (
          <>
            <div className="generate-box__icon">
              <Sparkles size={22} style={{ animation: 'spin 3s linear infinite' }} />
            </div>
            <div className="generate-box__title">Génération en cours</div>
            <div className="generate-box__sub">
              {mode === 'job_target'
                ? "L'IA optimise votre profil pour le poste cible et prépare 3 versions."
                : "L'IA intègre vos nouvelles missions et prépare 3 versions mises à jour."}
            </div>
            <div className="steps">
              {steps.map((s, i) => {
                const state = i < step ? 'done' : i === step ? 'active' : 'idle';
                return (
                  <div key={i} className="step">
                    <div className={`step__dot step__dot--${state}`}>
                      {state === 'done' && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {state === 'active' && <span className="ping" />}
                    </div>
                    <span className={`step__label step__label--${state}`}>{s}</span>
                  </div>
                );
              })}
            </div>
            <div className="progress-bar" style={{ marginTop: 24 }}>
              <div className="progress-bar__fill" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="generate-box__icon" style={{ background: 'var(--c-success-bg)', borderColor: 'var(--c-success-bd)' }}>
              <CheckCircle size={22} style={{ color: 'var(--c-success)' }} />
            </div>
            <div className="generate-box__title">CV générés !</div>
            <div className="generate-box__sub">Redirection vers vos propositions…</div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="generate-box__icon" style={{ background: 'var(--c-error-bg)', borderColor: 'var(--c-error-bd)' }}>
              <AlertCircle size={22} style={{ color: 'var(--c-error)' }} />
            </div>
            <div className="generate-box__title">Erreur de génération</div>
            <div className="alert alert--error" style={{ marginBottom: 20, marginTop: 8 }}>{error}</div>
            <button onClick={() => navigate('/upload')} className="btn btn--primary btn--full">Réessayer</button>
          </>
        )}
      </div>
    </div>
  );
}
