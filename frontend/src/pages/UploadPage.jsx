import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { Upload, FileText, X, Briefcase, RefreshCw, Target, Check, History, Eye } from 'lucide-react';

function DropZone({ label, hint, file, onChange, onClear, required }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  return (
    <div className="field">
      <label className="label">
        {label}{required && <span className="req"> *</span>}
      </label>
      {file ? (
        <div className="file-preview">
          <FileText size={18} className="file-preview__icon" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="file-preview__name">{file.name}</div>
            <div className="file-preview__size">{(file.size / 1024).toFixed(0)} Ko</div>
          </div>
          <button className="file-preview__remove" onClick={onClear} type="button">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          className={`dropzone${dragging ? ' dropzone--active' : ''}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload size={22} className="dropzone__icon" />
          <div className="dropzone__text">Glissez-déposez ou <span>parcourir</span></div>
          <div className="dropzone__hint">{hint}</div>
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => onChange(e.target.files[0])} />
        </div>
      )}
    </div>
  );
}

const MODES = [
  {
    id: 'update',
    Icon: RefreshCw,
    title: 'Mise à jour du CV',
    sub: 'Intègre tes nouvelles missions et compétences récentes dans le CV existant.',
  },
  {
    id: 'job_target',
    Icon: Target,
    title: 'Optimisation pour un poste',
    sub: 'Met en avant les expériences et compétences les plus pertinentes pour un poste cible.',
  },
];

export default function UploadPage() {
  const [cvFile, setCvFile] = useState(null);
  const [skillsFile, setSkillsFile] = useState(null);
  const [mode, setMode] = useState('update');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSession, setLastSession] = useState(null);
  const [usingLastCV, setUsingLastCV] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    cvApi.getHistory().then((res) => {
      const completed = res.data.find((s) => s.status === 'completed');
      if (completed) setLastSession(completed);
    }).catch(() => {});
  }, []);

  const handleReuse = () => {
    setUsingLastCV(true);
    setCvFile(null);
  };

  const handleViewLastCV = async () => {
    try { await cvApi.viewOriginalCV(lastSession.id); } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile && !usingLastCV) return setError('Veuillez sélectionner votre CV.');
    if (mode === 'job_target' && !jobTitle.trim()) return setError('Veuillez renseigner le poste cible.');
    setError('');
    setLoading(true);
    try {
      let sessionId;
      if (usingLastCV) {
        const formData = new FormData();
        if (skillsFile) formData.append('skills', skillsFile);
        if (jobTitle.trim()) formData.append('job_title', jobTitle.trim());
        const res = await cvApi.reuseLastCV(lastSession.id, formData);
        sessionId = res.data.session_id;
      } else {
        const formData = new FormData();
        formData.append('cv', cvFile);
        if (skillsFile) formData.append('skills', skillsFile);
        if (jobTitle.trim()) formData.append('job_title', jobTitle.trim());
        const res = await cvApi.upload(formData);
        sessionId = res.data.session_id;
      }
      navigate(`/generate/${sessionId}`, { state: { mode } });
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'upload. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container--md upload-page">
      <div className="page-header">
        <div>
          <div className="page-header__title">Nouveau CV</div>
          <div className="page-header__sub">Uploadez votre CV et configurez la génération IA.</div>
        </div>
      </div>

      {lastSession && !usingLastCV && (
        <div className="alert" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', padding: '12px 16px' }}>
          <History size={16} style={{ color: 'var(--c-primary)', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13 }}>
            Vous avez déjà un CV — réutilisez-le directement sans re-uploader.
          </span>
          <button type="button" onClick={handleReuse} className="btn btn--outline btn--sm">
            <RefreshCw size={13} />
            Réutiliser mon CV
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* CV */}
        <div className="section-card">
          <div className="section-card__header">
            <FileText size={15} style={{ color: 'var(--c-primary)' }} />
            Votre CV actuel
          </div>
          <div className="section-card__body">
            {usingLastCV ? (
              <div className="file-preview">
                <FileText size={18} className="file-preview__icon" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="file-preview__name">
                    cv-original.{lastSession.original_cv_path?.split('.').pop() || 'pdf'}
                  </div>
                  <div className="file-preview__size">
                    Déposé le {new Date(lastSession.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleViewLastCV}
                  className="btn btn--ghost btn--sm"
                  style={{ padding: '4px 8px' }}
                  title="Voir le fichier"
                >
                  <Eye size={14} />
                </button>
                <button className="file-preview__remove" onClick={() => setUsingLastCV(false)} type="button">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <DropZone
                label="CV"
                hint="PDF ou Word (.docx) · Max 20 Mo"
                file={cvFile}
                onChange={setCvFile}
                onClear={() => setCvFile(null)}
                required
              />
            )}
          </div>
        </div>

        {/* Mode */}
        <div className="section-card">
          <div className="section-card__header">
            <Target size={15} style={{ color: 'var(--c-primary)' }} />
            Objectif de la génération
          </div>
          <div className="section-card__body">
            <div className="mode-grid">
              {MODES.map(({ id, Icon, title, sub }) => (
                <div
                  key={id}
                  className={`mode-card${mode === id ? ' mode-card--active' : ''}`}
                  onClick={() => setMode(id)}
                >
                  {mode === id && (
                    <div className="mode-card__check">
                      <Check size={10} color="#fff" />
                    </div>
                  )}
                  <div className="mode-card__icon"><Icon size={16} /></div>
                  <div className="mode-card__title">{title}</div>
                  <div className="mode-card__sub">{sub}</div>
                </div>
              ))}
            </div>

            {mode === 'job_target' && (
              <div className="field" style={{ marginTop: 16 }}>
                <label className="label">Intitulé de poste cible <span className="req">*</span></label>
                <input
                  className="input"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex : Lead Developer Java, Architecte Cloud AWS, Chef de projet IT…"
                  autoFocus
                />
                <span className="hint">Les compétences et missions les plus pertinentes pour ce poste seront mises en avant.</span>
              </div>
            )}

            {mode === 'update' && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--c-surface-2)', border: '1px solid var(--c-border-lt)', fontSize: 12, color: 'var(--c-text-3)' }}>
                Le CV sera mis à jour avec vos nouvelles missions et compétences. Ajoutez une fiche de compétences ci-dessous pour enrichir la mise à jour.
              </div>
            )}
          </div>
        </div>

        {/* Fiche de compétences optionnelle */}
        <div className="section-card">
          <div className="section-card__header">
            <Briefcase size={15} style={{ color: 'var(--c-primary)' }} />
            Fiche de compétences / nouvelles missions
            <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 400, marginLeft: 6 }}>(optionnel)</span>
          </div>
          <div className="section-card__body">
            <DropZone
              label="Fiche de compétences"
              hint="Document listant vos nouvelles compétences ou missions — PDF ou Word"
              file={skillsFile}
              onChange={setSkillsFile}
              onClear={() => setSkillsFile(null)}
            />
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--c-text-3)' }}>
              Vous pouvez télécharger un modèle de fiche depuis la page résultats d'une génération précédente.
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || !cvFile} className="btn btn--primary btn--full btn--lg">
          {loading
            ? <><span className="spinner spinner--sm spinner--white" /> Upload en cours…</>
            : <><Upload size={15} /> Générer mes CV</>
          }
        </button>
      </form>
    </div>
  );
}
