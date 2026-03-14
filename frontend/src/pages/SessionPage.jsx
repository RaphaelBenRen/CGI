import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { Download, Check, ChevronLeft, Sparkles, Pencil } from 'lucide-react';
import CVPreviewReadOnly from '../components/CVPreviewReadOnly';

const TYPE_LABELS = {
  technique:  { label: 'Axe Technique',   cls: 'badge--purple' },
  experience: { label: 'Axe Expériences', cls: 'badge--orange' },
  equilibre:  { label: 'Équilibré',        cls: 'badge--teal'   },
};

const A4_W = 794;
const A4_H = 1123;

function MiniPreview({ cvData, onClick }) {
  const DISPLAY_W = 320;
  const scale = DISPLAY_W / A4_W;

  return (
    <div
      onClick={onClick}
      style={{
        width: DISPLAY_W,
        height: A4_H * scale,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        border: '1px solid var(--c-border)',
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} />
      <div style={{
        width: A4_W,
        height: A4_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        pointerEvents: 'none',
      }}>
        <CVPreviewReadOnly cvData={cvData} />
      </div>
    </div>
  );
}

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectingId, setSelectingId] = useState(null);

  useEffect(() => {
    cvApi.getSession(sessionId)
      .then((res) => setSession(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleSelect = async (versionId) => {
    setSelectingId(versionId);
    try {
      await cvApi.selectVersion(versionId);
      setSession((prev) => ({
        ...prev,
        cv_versions: prev.cv_versions.map((v) => ({ ...v, is_selected: v.id === versionId })),
      }));
    } finally { setSelectingId(null); }
  };

  const handleDownload = async (version) => {
    setDownloadingId(version.id);
    try {
      const name = version.cv_data?.personal_info?.full_name || 'consultant';
      await cvApi.downloadPDF(version.id, `CV_${name}_${version.version_type}.pdf`);
    } finally { setDownloadingId(null); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <span className="spinner" />
    </div>
  );

  if (!session) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--c-text-3)' }}>Session introuvable.</div>
  );

  const versions = session.cv_versions || [];

  return (
    <div className="session-page">
      <div className="session-header">
        <div className="session-header__inner">
          <button className="session-header__back" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="session-header__title">
              {session.job_title ? `Propositions — "${session.job_title}"` : 'Propositions de CV'}
            </div>
            <div className="session-header__sub">
              <Sparkles size={12} />
              {versions.length} version{versions.length > 1 ? 's' : ''} générée{versions.length > 1 ? 's' : ''} — cliquez sur un CV pour l'ouvrir et le modifier
            </div>
          </div>
        </div>
      </div>

      <div className="cv-grid">
        {versions.map((version) => {
          const info = TYPE_LABELS[version.version_type] || TYPE_LABELS.equilibre;
          const selected = version.is_selected;

          return (
            <div key={version.id} className={`cv-card${selected ? ' cv-card--selected' : ''}`}>
              <div className="cv-card__header">
                <div>
                  <span className={`badge ${info.cls}`}>{info.label}</span>
                  <div className="cv-card__title">{version.title}</div>
                  <div className="cv-card__angle">{version.angle}</div>
                </div>
                {selected && (
                  <span className="badge badge--blue">
                    <Check size={10} /> Sélectionné
                  </span>
                )}
              </div>

              <MiniPreview
                cvData={version.cv_data}
                onClick={() => navigate(`/edit/${version.id}`)}
              />

              <div className="cv-card__actions">
                <button
                  onClick={() => navigate(`/edit/${version.id}`)}
                  className="btn btn--primary btn--sm"
                  style={{ flex: 1 }}
                >
                  <Pencil size={12} />
                  Ouvrir &amp; modifier
                </button>

                <button
                  onClick={() => handleSelect(version.id)}
                  disabled={selectingId === version.id || selected}
                  className={`btn btn--sm ${selected ? 'btn--outline' : 'btn--ghost'}`}
                >
                  <Check size={12} />
                  {selected ? 'Choisi' : 'Choisir'}
                </button>

                <button
                  onClick={() => handleDownload(version)}
                  disabled={downloadingId === version.id}
                  className="btn btn--ghost btn--sm"
                >
                  {downloadingId === version.id
                    ? <span className="spinner spinner--sm" />
                    : <Download size={12} />
                  }
                  PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
