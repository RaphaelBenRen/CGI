import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { Download, Check, ChevronLeft, Sparkles, Pencil } from 'lucide-react';
import CVPreviewReadOnly from '../components/CVPreviewReadOnly';

const TYPE_LABELS = {
  technique:  { label: 'Axe Technique',    color: 'bg-purple-100 text-purple-700' },
  experience: { label: 'Axe Expériences',  color: 'bg-orange-100 text-orange-700' },
  equilibre:  { label: 'Équilibré',         color: 'bg-teal-100 text-teal-700'    },
};

// Facteur de zoom pour la mini-preview (A4 = 794px large à 96dpi)
const A4_W = 794;
const A4_H = 1123;

function MiniPreview({ cvData, onClick }) {
  // On calcule le scale pour tenir dans la colonne
  const DISPLAY_W = 340; // px d'affichage cible
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
        borderRadius: 8,
        boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
        flexShrink: 0,
      }}
      className="transition-transform hover:scale-[1.01] hover:shadow-xl"
    >
      {/* Couverture transparente pour intercepter les clics */}
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
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!session) return <div className="text-center py-20 text-slate-500">Session introuvable.</div>;

  const versions = session.cv_versions || [];

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {session.job_title ? `Propositions pour "${session.job_title}"` : 'Propositions de CV'}
            </h1>
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-0.5">
              <Sparkles size={13} />
              {versions.length} version{versions.length > 1 ? 's' : ''} générée{versions.length > 1 ? 's' : ''} — cliquez sur un CV pour l'ouvrir et le modifier
            </p>
          </div>
        </div>
      </div>

      {/* Grille des 3 previews */}
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="flex gap-6 justify-center flex-wrap">
          {versions.map((version) => {
            const typeInfo = TYPE_LABELS[version.version_type] || TYPE_LABELS.equilibre;
            const selected = version.is_selected;

            return (
              <div key={version.id} className={`flex flex-col gap-3 rounded-2xl p-3 transition-all ${selected ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-white ring-1 ring-slate-200 hover:ring-slate-300'}`}>

                {/* Badge + titre */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <p className="text-slate-800 font-medium text-sm mt-1.5">{version.title}</p>
                    <p className="text-slate-400 text-xs">{version.angle}</p>
                  </div>
                  {selected && (
                    <span className="flex items-center gap-1 text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                      <Check size={11} /> Sélectionné
                    </span>
                  )}
                </div>

                {/* Mini preview — clic → page d'édition */}
                <MiniPreview
                  cvData={version.cv_data}
                  onClick={() => navigate(`/edit/${version.id}`)}
                />

                {/* Actions */}
                <div className="flex gap-2 px-1">
                  <button
                    onClick={() => navigate(`/edit/${version.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Pencil size={13} />
                    Ouvrir &amp; modifier
                  </button>

                  <button
                    onClick={() => handleSelect(version.id)}
                    disabled={selectingId === version.id || selected}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selected ? 'bg-blue-100 text-blue-700 cursor-default' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Check size={13} />
                    {selected ? 'Choisi' : 'Choisir'}
                  </button>

                  <button
                    onClick={() => handleDownload(version)}
                    disabled={downloadingId === version.id}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                  >
                    {downloadingId === version.id
                      ? <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      : <Download size={13} />
                    }
                    PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
