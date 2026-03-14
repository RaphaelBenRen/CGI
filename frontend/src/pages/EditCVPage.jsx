import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { Save, ChevronLeft, Download, Plus, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

/* ──────────────────────────────────────────────
   Composant de texte éditable inline (contentEditable)
   Synchronise avec le state React via onBlur.
   N'écrase pas le DOM pendant la frappe.
────────────────────────────────────────────── */
function Editable({ value, onChange, style, block = false, className = '' }) {
  const ref = useRef(null);

  // Init au montage
  useEffect(() => {
    if (ref.current) ref.current.textContent = value ?? '';
  }, []); // eslint-disable-line

  // Sync si la valeur change depuis l'extérieur (panneau gauche)
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      if (ref.current.textContent !== (value ?? '')) {
        ref.current.textContent = value ?? '';
      }
    }
  }, [value]);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const v = e.currentTarget.textContent.trim();
        if (v !== (value ?? '')) onChange(v);
      }}
      style={{
        display: block ? 'block' : 'inline-block',
        outline: 'none',
        cursor: 'text',
        minWidth: '2em',
        minHeight: '1em',
        transition: 'background .1s',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,48,135,.08)'; }}
      onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = ''; }}
      onFocus={(e) => { e.currentTarget.style.background = 'rgba(0,48,135,.06)'; e.currentTarget.style.outline = '1px solid rgba(0,48,135,.4)'; }}
      onBlurCapture={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.outline = 'none'; }}
      className={className}
    />
  );
}

/* ──────────────────────────────────────────────
   CV Preview + édition inline
────────────────────────────────────────────── */
function CVEditable({ cvData, update, updateExp }) {
  const p = cvData?.personal_info || {};
  const cv = cvData || {};

  const upP = (k) => (v) => update(`personal_info.${k}`, v);

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9.5px', color: '#2d2d2d', background: '#fff', minHeight: '297mm', lineHeight: 1.4, boxShadow: '0 4px 32px rgba(0,0,0,0.2)' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #003087 0%, #0050c8 100%)', color: 'white', padding: '14px 28px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Editable value={p.full_name} onChange={upP('full_name')}
              style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.3, color: 'white', display: 'block' }} />
            <Editable value={p.title} onChange={upP('title')}
              style={{ fontSize: 11, color: '#a8c4ff', marginTop: 2, display: 'block' }} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, letterSpacing: 1, border: '1px solid rgba(255,255,255,0.3)' }}>CGI</div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {['email', 'phone', 'location', 'linkedin'].map((k) => (
            <span key={k} style={{ fontSize: 9, color: '#c8daff', display: 'flex', alignItems: 'center', gap: 4 }}>
              {k === 'email' ? '✉' : k === 'phone' ? '☎' : k === 'location' ? '⚑' : 'in'}
              <Editable value={p[k]} onChange={upP(k)} style={{ color: '#c8daff', flex: 1 }} />
            </span>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '175px 1fr', gridTemplateRows: '1fr', flex: 1, minHeight: 0 }}>

        {/* SIDEBAR */}
        <div style={{ background: '#f0f4ff', padding: '14px 12px', borderRight: '2px solid #dde8ff', alignSelf: 'stretch' }}>

          {/* Compétences */}
          <SideTitle>Compétences</SideTitle>
          <div style={{ marginBottom: 12 }}>
            {(cv.skills || []).map((s, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: '#003087', color: 'white', padding: '2px 6px', borderRadius: 2, fontSize: 8, margin: '1.5px 1.5px 1.5px 0', fontWeight: 500 }}>
                <Editable value={s} onChange={(v) => {
                  const sk = [...(cv.skills || [])]; sk[i] = v; update('skills', sk);
                }} style={{ color: 'white' }} />
                <button onClick={() => update('skills', (cv.skills || []).filter((_, idx) => idx !== i))}
                  style={{ marginLeft: 3, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0, fontSize: 9, lineHeight: 1 }}>×</button>
              </span>
            ))}
            <button onClick={() => update('skills', [...(cv.skills || []), 'Nouvelle compétence'])}
              style={{ display: 'inline-block', background: 'rgba(0,48,135,0.15)', color: '#003087', border: '1px dashed #003087', padding: '2px 6px', borderRadius: 2, fontSize: 8, margin: '1.5px 1.5px 1.5px 0', cursor: 'pointer' }}>
              + Ajouter
            </button>
          </div>

          {/* Formation */}
          <SideTitle>Formation</SideTitle>
          <div style={{ marginBottom: 12 }}>
            {(cv.education || []).map((edu, i) => (
              <div key={i} style={{ marginBottom: 7, position: 'relative' }}>
                <button onClick={() => update('education', (cv.education || []).filter((_, idx) => idx !== i))}
                  style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 10 }}>×</button>
                <Editable value={edu.degree} onChange={(v) => { const e2 = [...cv.education]; e2[i] = { ...e2[i], degree: v }; update('education', e2); }}
                  style={{ fontWeight: 600, fontSize: 8.5, color: '#1a1a2e', display: 'block' }} />
                <Editable value={edu.school} onChange={(v) => { const e2 = [...cv.education]; e2[i] = { ...e2[i], school: v }; update('education', e2); }}
                  style={{ fontSize: 8, color: '#555', display: 'block', marginTop: 1 }} />
                <Editable value={edu.year} onChange={(v) => { const e2 = [...cv.education]; e2[i] = { ...e2[i], year: v }; update('education', e2); }}
                  style={{ fontSize: 7.5, color: '#777', fontStyle: 'italic', display: 'block' }} />
              </div>
            ))}
            <AddBtn onClick={() => update('education', [...(cv.education || []), { degree: 'Diplôme', school: 'École', year: '2020', details: '' }])}>
              + Formation
            </AddBtn>
          </div>

          {/* Langues */}
          {(cv.languages?.length > 0) && (
            <>
              <SideTitle>Langues</SideTitle>
              <div style={{ marginBottom: 12 }}>
                {(cv.languages || []).map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                    <Editable value={l.language} onChange={(v) => { const ls = [...cv.languages]; ls[i] = { ...ls[i], language: v }; update('languages', ls); }}
                      style={{ fontWeight: 600, fontSize: 8.5 }} />
                    <Editable value={l.level} onChange={(v) => { const ls = [...cv.languages]; ls[i] = { ...ls[i], level: v }; update('languages', ls); }}
                      style={{ fontSize: 8, color: '#003087' }} />
                    <button onClick={() => update('languages', (cv.languages || []).filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 10, marginLeft: 2 }}>×</button>
                  </div>
                ))}
                <AddBtn onClick={() => update('languages', [...(cv.languages || []), { language: 'Langue', level: 'Niveau' }])}>+ Langue</AddBtn>
              </div>
            </>
          )}

          {/* Certifications */}
          {(cv.certifications?.length > 0) && (
            <>
              <SideTitle>Certifications</SideTitle>
              <div>
                {(cv.certifications || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 3 }}>
                    <span style={{ color: '#003087', fontSize: 8 }}>▸</span>
                    <Editable value={c} onChange={(v) => { const cs = [...cv.certifications]; cs[i] = v; update('certifications', cs); }}
                      style={{ fontSize: 8, flex: 1 }} />
                    <button onClick={() => update('certifications', (cv.certifications || []).filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 10 }}>×</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* MAIN */}
        <div style={{ padding: '14px 20px' }}>

          {/* Profil */}
          <MainTitle>Profil</MainTitle>
          <div style={{ fontSize: 9, color: '#333', lineHeight: 1.5, background: '#f8f9ff', padding: '7px 10px', borderLeft: '2.5px solid #003087', marginBottom: 10 }}>
            <Editable value={cv.summary} onChange={(v) => update('summary', v)} block style={{ display: 'block', lineHeight: 1.5 }} />
          </div>

          {/* Expériences */}
          <MainTitle>Expériences professionnelles</MainTitle>
          {(cv.experiences || []).map((exp, i) => (
            <div key={i} style={{ marginBottom: 8, paddingBottom: 7, borderBottom: i < cv.experiences.length - 1 ? '1px solid #eef0f8' : 'none', position: 'relative' }}>
              <button onClick={() => update('experiences', (cv.experiences || []).filter((_, idx) => idx !== i))}
                style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 13 }}>×</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                <div style={{ flex: 1, paddingRight: 40 }}>
                  <Editable value={exp.title} onChange={(v) => updateExp(i, 'title', v)}
                    style={{ fontSize: 9.5, fontWeight: 700, color: '#1a1a2e', display: 'block' }} />
                  <div style={{ fontSize: 8.5, color: '#003087', fontWeight: 500, marginTop: 1 }}>
                    <Editable value={exp.company} onChange={(v) => updateExp(i, 'company', v)} style={{ color: '#003087', fontWeight: 500 }} />
                    {' '}
                    <Editable value={exp.location} onChange={(v) => updateExp(i, 'location', v)} style={{ color: '#888', fontWeight: 400 }} />
                  </div>
                </div>
                <Editable value={exp.period} onChange={(v) => updateExp(i, 'period', v)}
                  style={{ fontSize: 8, color: '#888', background: '#e8eeff', padding: '1px 6px', borderRadius: 8, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }} />
              </div>
              <ul style={{ paddingLeft: 12, marginTop: 3 }}>
                {(exp.missions || []).map((m, j) => (
                  <li key={j} style={{ fontSize: 8.5, color: '#333', marginBottom: 1.5, lineHeight: 1.35, display: 'flex', alignItems: 'flex-start', gap: 3, listStyle: 'none' }}>
                    <span style={{ color: '#003087', flexShrink: 0, marginTop: 1 }}>•</span>
                    <Editable value={m} onChange={(v) => { const ms = [...exp.missions]; ms[j] = v; updateExp(i, 'missions', ms); }}
                      block style={{ flex: 1, display: 'block' }} />
                    <button onClick={() => updateExp(i, 'missions', exp.missions.filter((_, idx) => idx !== j))}
                      style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 10, flexShrink: 0, padding: '0 2px' }}>×</button>
                  </li>
                ))}
                <li style={{ listStyle: 'none' }}>
                  <AddBtn onClick={() => updateExp(i, 'missions', [...(exp.missions || []), 'Nouvelle mission'])}>+ Mission</AddBtn>
                </li>
              </ul>
            </div>
          ))}
          <AddBtn onClick={() => update('experiences', [...(cv.experiences || []), { title: 'Nouveau poste', company: 'Entreprise', period: '2024 - Présent', location: '', missions: ['Mission principale'] }])}>
            + Ajouter une expérience
          </AddBtn>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#003087', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '4px', fontSize: 7, letterSpacing: 0.3 }}>
        Document généré via la Plateforme CGI — Confidentiel
      </div>
    </div>
  );
}

function SideTitle({ children }) {
  return <div style={{ fontSize: 7.5, fontWeight: 700, color: '#003087', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 6, paddingBottom: 3, borderBottom: '1.5px solid #003087' }}>{children}</div>;
}
function MainTitle({ children }) {
  return <div style={{ fontSize: 9, fontWeight: 700, color: '#003087', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, paddingBottom: 3, borderBottom: '1.5px solid #003087' }}>{children}</div>;
}
function AddBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: '1px dashed #99b', color: '#778', borderRadius: 3, padding: '1px 8px', fontSize: 8, cursor: 'pointer', marginTop: 2 }}>
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────
   Page principale
────────────────────────────────────────────── */
export default function EditCVPage() {
  const { versionId } = useParams();
  const navigate = useNavigate();
  const [version, setVersion] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    cvApi.getVersion(versionId)
      .then((res) => { setVersion(res.data); setCvData(res.data.cv_data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [versionId]);

  const update = (path, value) => {
    setSaved(false);
    setCvData((prev) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateExp = (i, field, value) => {
    setCvData((prev) => {
      const next = structuredClone(prev);
      next.experiences[i] = { ...next.experiences[i], [field]: value };
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await cvApi.updateVersion(versionId, cvData); setSaved(true); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const name = cvData?.personal_info?.full_name || 'consultant';
      await cvApi.downloadPDF(versionId, `CV_${name}_${version?.version_type}.pdf`);
    } finally { setDownloading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <span className="spinner" />
    </div>
  );
  if (!cvData) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#8892a4' }}>Version introuvable.</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#dde2ec' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fff', borderBottom: '1px solid #c8cdd8', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #c8cdd8', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#4a5368' }}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <span style={{ fontWeight: 600, color: '#1a2035', fontSize: 13 }}>{version?.title || 'Éditer le CV'}</span>
            {version?.angle && <span style={{ marginLeft: 10, fontSize: 11, color: '#8892a4' }}>{version.angle}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#8892a4' }}>Cliquez sur n'importe quel texte pour le modifier</span>
          <button onClick={handleDownload} disabled={downloading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #c8cdd8', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#1a2035', opacity: downloading ? .5 : 1 }}>
            {downloading ? <span className="spinner spinner--sm" /> : <Download size={13} />}
            Télécharger PDF
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#003087', border: '1px solid #003087', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff', opacity: saving ? .6 : 1 }}>
            {saving ? <span className="spinner spinner--sm spinner--white" /> : <Save size={13} />}
            {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Corps : CV centré */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '210mm', flexShrink: 0 }}>
          <CVEditable cvData={cvData} update={update} updateExp={updateExp} />
        </div>
      </div>
    </div>
  );
}
