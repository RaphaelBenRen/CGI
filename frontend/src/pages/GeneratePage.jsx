import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function GeneratePage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | generating | done | error
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  const steps = [
    'Lecture de votre CV...',
    'Extraction des informations...',
    'Analyse des compétences...',
    'Génération des propositions avec l\'IA...',
    'Finalisation...',
  ];

  useEffect(() => {
    let interval;
    startGeneration();

    async function startGeneration() {
      setStatus('generating');

      interval = setInterval(() => {
        setStep((s) => (s < steps.length - 1 ? s + 1 : s));
      }, 3000);

      try {
        await cvApi.generate(sessionId);
        clearInterval(interval);
        setStatus('done');
        setTimeout(() => navigate(`/session/${sessionId}`), 1000);
      } catch (err) {
        clearInterval(interval);
        setError(err.response?.data?.error || 'Erreur lors de la génération.');
        setStatus('error');
      }
    }

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {status === 'generating' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles size={28} className="text-blue-700 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Génération en cours</h2>
            <p className="text-slate-500 text-sm mb-8">
              L'IA analyse votre profil et prépare 3 versions de CV personnalisées.
            </p>

            {/* Progress steps */}
            <div className="space-y-3 text-left">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    i < step ? 'bg-green-500' : i === step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}>
                    {i < step ? (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i === step ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    ) : null}
                  </div>
                  <span className={`text-sm ${i <= step ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                    {s}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-10">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">CV générés !</h2>
            <p className="text-slate-500 text-sm mt-2">Redirection vers vos propositions...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-10">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur de génération</h2>
            <p className="text-red-600 text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
