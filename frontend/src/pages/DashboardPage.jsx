import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Clock, CheckCircle, AlertCircle, ChevronRight, Plus, Upload, Trash2 } from 'lucide-react';

const STATUS_MAP = {
  uploaded:   { label: 'En attente',  cls: 'badge--grey',   Icon: Clock },
  processing: { label: 'Traitement…', cls: 'badge--yellow', Icon: Clock },
  completed:  { label: 'Terminé',     cls: 'badge--green',  Icon: CheckCircle },
  error:      { label: 'Erreur',      cls: 'badge--red',    Icon: AlertCircle },
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    cvApi.getHistory()
      .then((res) => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (session) => {
    if (session.status === 'completed') navigate(`/session/${session.id}`);
    else if (session.status === 'uploaded') navigate(`/generate/${session.id}`);
  };

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer cette session et tous ses CV ?')) return;
    setDeletingId(sessionId);
    try {
      await cvApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      <div className="page-header">
        <div>
          <div className="page-header__title">Tableau de bord</div>
          <div className="page-header__sub">Retrouvez tous vos CV générés</div>
        </div>
        <Link to="/upload" className="btn btn--primary">
          <Plus size={14} />
          Nouveau CV
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <span className="spinner" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><FileText size={24} /></div>
          <div className="empty-state__title">Aucun CV généré</div>
          <div className="empty-state__sub">Commencez par uploader votre CV pour obtenir des propositions personnalisées.</div>
          <Link to="/upload" className="btn btn--primary">
            <Upload size={14} />
            Uploader un CV
          </Link>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((session) => {
            const s = STATUS_MAP[session.status] || STATUS_MAP.uploaded;
            const Icon = s.Icon;
            return (
              <div key={session.id} className="session-item" onClick={() => handleClick(session)}>
                <div className="session-item__icon">
                  <FileText size={18} />
                </div>
                <div className="session-item__body">
                  <div className="session-item__title">
                    {session.job_title || 'Mise à jour générale'}
                    <span className={`badge ${s.cls}`}>
                      <Icon size={10} />
                      {s.label}
                    </span>
                  </div>
                  <div className="session-item__meta">
                    {formatDate(session.created_at)}
                    {session.cv_versions?.length > 0 && (
                      <> · {session.cv_versions.length} version{session.cv_versions.length > 1 ? 's' : ''}
                      {session.cv_versions.some((v) => v.is_selected) && ' · 1 sélectionnée'}</>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    disabled={deletingId === session.id}
                    className="btn btn--ghost btn--sm"
                    style={{ padding: '4px 8px', color: 'var(--c-text-3)' }}
                    title="Supprimer"
                  >
                    {deletingId === session.id ? <span className="spinner spinner--sm" /> : <Trash2 size={14} />}
                  </button>
                  <ChevronRight size={16} style={{ color: 'var(--c-text-3)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
