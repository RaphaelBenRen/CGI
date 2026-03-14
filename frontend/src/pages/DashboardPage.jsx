import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, ChevronRight, Plus } from 'lucide-react';

const STATUS_MAP = {
  uploaded: { label: 'Uploadé', color: 'bg-slate-100 text-slate-600', icon: Clock },
  processing: { label: 'Traitement...', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  error: { label: 'Erreur', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    cvApi.getHistory()
      .then((res) => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 mt-1 text-sm">Retrouvez tous vos CV générés</p>
        </div>
        <Link
          to="/upload"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nouveau CV
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-2">Aucun CV généré</h3>
          <p className="text-slate-500 text-sm mb-6">
            Commencez par uploader votre CV pour obtenir des propositions personnalisées.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-800 transition-colors"
          >
            <Upload size={16} />
            Uploader un CV
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const status = STATUS_MAP[session.status] || STATUS_MAP.uploaded;
            const StatusIcon = status.icon;

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => {
                  if (session.status === 'completed') {
                    navigate(`/session/${session.id}`);
                  } else if (session.status === 'uploaded') {
                    navigate(`/generate/${session.id}`);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {session.job_title || 'Mise à jour générale'}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-0.5">{formatDate(session.created_at)}</p>
                      {session.cv_versions?.length > 0 && (
                        <p className="text-slate-400 text-xs mt-1">
                          {session.cv_versions.length} version{session.cv_versions.length > 1 ? 's' : ''} générée{session.cv_versions.length > 1 ? 's' : ''}
                          {session.cv_versions.some((v) => v.is_selected) && ' · 1 sélectionnée'}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
