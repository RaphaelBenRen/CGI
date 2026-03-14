import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { Upload, FileText, X, Briefcase } from 'lucide-react';

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
          <div className="dropzone__text">
            Glissez-déposez ou <span>parcourir</span>
          </div>
          <div className="dropzone__hint">{hint}</div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => onChange(e.target.files[0])}
          />
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  const [cvFile, setCvFile] = useState(null);
  const [skillsFile, setSkillsFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) return setError('Veuillez sélectionner votre CV.');
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('cv', cvFile);
      if (skillsFile) formData.append('skills', skillsFile);
      if (jobTitle.trim()) formData.append('job_title', jobTitle.trim());
      const res = await cvApi.upload(formData);
      navigate(`/generate/${res.data.session_id}`);
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
          <div className="page-header__sub">Uploadez votre CV et laissez l'IA générer 3 versions personnalisées.</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="section-card">
          <div className="section-card__header">
            <FileText size={15} style={{ color: 'var(--c-primary)' }} />
            Votre CV actuel
          </div>
          <div className="section-card__body">
            <DropZone
              label="CV"
              hint="PDF ou Word (.docx) · Max 20 Mo"
              file={cvFile}
              onChange={setCvFile}
              onClear={() => setCvFile(null)}
              required
            />
          </div>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <Briefcase size={15} style={{ color: 'var(--c-primary)' }} />
            Personnalisation
            <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 400, marginLeft: 6 }}>(optionnel)</span>
          </div>
          <div className="section-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DropZone
              label="Fiche de compétences / nouvelles missions"
              hint="Document listant vos nouvelles compétences ou missions — PDF ou Word"
              file={skillsFile}
              onChange={setSkillsFile}
              onClear={() => setSkillsFile(null)}
            />

            <div className="field">
              <label className="label">Intitulé de poste cible</label>
              <input
                className="input"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex : Lead Developer Java, Architecte Cloud AWS…"
              />
              <span className="hint">Si renseigné, les CV seront optimisés pour ce poste.</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !cvFile}
          className="btn btn--primary btn--full btn--lg"
        >
          {loading ? (
            <><span className="spinner spinner--sm spinner--white" /> Upload en cours…</>
          ) : (
            <><Upload size={15} /> Générer mes CV</>
          )}
        </button>
      </form>
    </div>
  );
}
