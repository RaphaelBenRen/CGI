import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function CVPreviewModal({ version, onClose }) {
  const cv = version?.cv_data || {};
  const p = cv.personal_info || {};

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Topbar modale */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 flex-shrink-0">
          <div>
            <span className="font-semibold text-slate-800 text-sm">{version?.title}</span>
            <span className="ml-2 text-xs text-slate-400">{version?.angle}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps scrollable — rendu du CV */}
        <div className="overflow-y-auto flex-1">
          {/* Simuler le rendu A4 avec le même design que le PDF */}
          <div
            style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px', color: '#2d2d2d', background: '#fff' }}
          >
            {/* HEADER */}
            <div style={{
              background: 'linear-gradient(135deg, #003087 0%, #0050c8 100%)',
              color: 'white',
              padding: '20px 32px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.3px' }}>
                    {p.full_name || 'Consultant'}
                  </div>
                  {p.title && (
                    <div style={{ fontSize: '12px', color: '#a8c4ff', marginTop: '3px' }}>{p.title}</div>
                  )}
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '5px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}>CGI</div>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                {p.email && <span style={{ fontSize: '10px', color: '#c8daff' }}>✉ {p.email}</span>}
                {p.phone && <span style={{ fontSize: '10px', color: '#c8daff' }}>☎ {p.phone}</span>}
                {p.location && <span style={{ fontSize: '10px', color: '#c8daff' }}>⚑ {p.location}</span>}
                {p.linkedin && <span style={{ fontSize: '10px', color: '#c8daff' }}>in {p.linkedin}</span>}
              </div>
            </div>

            {/* BODY 2 colonnes */}
            <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr' }}>

              {/* SIDEBAR */}
              <div style={{ background: '#f0f4ff', padding: '18px 14px', borderRight: '2px solid #dde8ff' }}>

                {/* Compétences */}
                {cv.skills?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '8px', fontWeight: 700, color: '#003087',
                      textTransform: 'uppercase', letterSpacing: '1.2px',
                      marginBottom: '7px', paddingBottom: '4px',
                      borderBottom: '1.5px solid #003087',
                    }}>Compétences</div>
                    <div>
                      {cv.skills.map((s, i) => (
                        <span key={i} style={{
                          display: 'inline-block', background: '#003087', color: 'white',
                          padding: '2px 7px', borderRadius: '2px', fontSize: '8.5px',
                          margin: '2px 2px 2px 0', fontWeight: 500,
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formation */}
                {cv.education?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '8px', fontWeight: 700, color: '#003087',
                      textTransform: 'uppercase', letterSpacing: '1.2px',
                      marginBottom: '7px', paddingBottom: '4px',
                      borderBottom: '1.5px solid #003087',
                    }}>Formation</div>
                    {cv.education.map((edu, i) => (
                      <div key={i} style={{ marginBottom: '10px' }}>
                        <div style={{ fontWeight: 600, fontSize: '9px', color: '#1a1a2e' }}>{edu.degree}</div>
                        <div style={{ fontSize: '8.5px', color: '#555', marginTop: '1px' }}>
                          {edu.school}{edu.year ? ` — ${edu.year}` : ''}
                        </div>
                        {edu.details && (
                          <div style={{ fontSize: '8px', color: '#777', fontStyle: 'italic', marginTop: '1px' }}>{edu.details}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Langues */}
                {cv.languages?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '8px', fontWeight: 700, color: '#003087',
                      textTransform: 'uppercase', letterSpacing: '1.2px',
                      marginBottom: '7px', paddingBottom: '4px',
                      borderBottom: '1.5px solid #003087',
                    }}>Langues</div>
                    {cv.languages.map((l, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '9px' }}>{l.language}</span>
                        <span style={{ fontSize: '8.5px', color: '#003087' }}>{l.level}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Certifications */}
                {cv.certifications?.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '8px', fontWeight: 700, color: '#003087',
                      textTransform: 'uppercase', letterSpacing: '1.2px',
                      marginBottom: '7px', paddingBottom: '4px',
                      borderBottom: '1.5px solid #003087',
                    }}>Certifications</div>
                    <ul style={{ paddingLeft: '12px', margin: 0 }}>
                      {cv.certifications.map((c, i) => (
                        <li key={i} style={{ fontSize: '8.5px', marginBottom: '3px', color: '#333' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* MAIN */}
              <div style={{ padding: '18px 24px' }}>

                {/* Profil */}
                {cv.summary && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{
                      fontSize: '9.5px', fontWeight: 700, color: '#003087',
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                      marginBottom: '7px', paddingBottom: '4px',
                      borderBottom: '1.5px solid #003087',
                    }}>Profil</div>
                    <div style={{
                      fontSize: '9.5px', color: '#333', lineHeight: 1.6,
                      background: '#f8f9ff', padding: '9px 12px',
                      borderLeft: '2.5px solid #003087',
                    }}>{cv.summary}</div>
                  </div>
                )}

                {/* Expériences */}
                {cv.experiences?.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '9.5px', fontWeight: 700, color: '#003087',
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                      marginBottom: '10px', paddingBottom: '4px',
                      borderBottom: '1.5px solid #003087',
                    }}>Expériences professionnelles</div>
                    {cv.experiences.map((exp, i) => (
                      <div key={i} style={{
                        marginBottom: '12px', paddingBottom: '10px',
                        borderBottom: i < cv.experiences.length - 1 ? '1px solid #eef0f8' : 'none',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                          <div>
                            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#1a1a2e' }}>{exp.title}</div>
                            <div style={{ fontSize: '9px', color: '#003087', fontWeight: 500, marginTop: '1px' }}>
                              {exp.company}{exp.location ? ` — ${exp.location}` : ''}
                            </div>
                          </div>
                          {exp.period && (
                            <span style={{
                              fontSize: '8.5px', color: '#888',
                              background: '#e8eeff', padding: '2px 8px',
                              borderRadius: '8px', fontWeight: 500,
                              marginLeft: '10px', whiteSpace: 'nowrap', flexShrink: 0,
                            }}>{exp.period}</span>
                          )}
                        </div>
                        {exp.missions?.length > 0 ? (
                          <ul style={{ paddingLeft: '14px', marginTop: '4px' }}>
                            {exp.missions.map((m, j) => (
                              <li key={j} style={{ fontSize: '9px', color: '#333', marginBottom: '2px', lineHeight: 1.5 }}>{m}</li>
                            ))}
                          </ul>
                        ) : exp.description ? (
                          <p style={{ fontSize: '9px', color: '#333', marginTop: '4px', lineHeight: 1.5 }}>{exp.description}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div style={{
              background: '#003087', color: 'rgba(255,255,255,0.6)',
              textAlign: 'center', padding: '6px',
              fontSize: '8px', letterSpacing: '0.3px',
            }}>
              Document généré via la Plateforme CGI — Confidentiel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
