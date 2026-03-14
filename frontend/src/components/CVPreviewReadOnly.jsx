/**
 * Rendu read-only du CV — utilisé pour les mini-previews dans SessionPage.
 * Les dimensions et styles correspondent exactement au template PDF (pdfGenerator.js).
 */
export default function CVPreviewReadOnly({ cvData }) {
  const p = cvData?.personal_info || {};
  const cv = cvData || {};

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9.5px', color: '#2d2d2d', background: '#fff', minHeight: '297mm', lineHeight: 1.4 }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #003087 0%, #0050c8 100%)', color: 'white', padding: '14px 28px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.3 }}>{p.full_name || 'Consultant'}</div>
            {p.title && <div style={{ fontSize: 11, color: '#a8c4ff', marginTop: 2 }}>{p.title}</div>}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, letterSpacing: 1, border: '1px solid rgba(255,255,255,0.3)' }}>CGI</div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {p.email    && <span style={{ fontSize: 9, color: '#c8daff' }}>✉ {p.email}</span>}
          {p.phone    && <span style={{ fontSize: 9, color: '#c8daff' }}>☎ {p.phone}</span>}
          {p.location && <span style={{ fontSize: 9, color: '#c8daff' }}>⚑ {p.location}</span>}
          {p.linkedin && <span style={{ fontSize: 9, color: '#c8daff' }}>in {p.linkedin}</span>}
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '175px 1fr', gridTemplateRows: '1fr', flex: 1, minHeight: 0 }}>

        {/* SIDEBAR */}
        <div style={{ background: '#f0f4ff', padding: '14px 12px', borderRight: '2px solid #dde8ff', alignSelf: 'stretch' }}>

          {cv.skills?.length > 0 && (
            <SideSection title="Compétences">
              <div>{cv.skills.map((s, i) => (
                <span key={i} style={{ display: 'inline-block', background: '#003087', color: 'white', padding: '2px 6px', borderRadius: 2, fontSize: 8, margin: '1.5px 1.5px 1.5px 0', fontWeight: 500 }}>{s}</span>
              ))}</div>
            </SideSection>
          )}

          {cv.education?.length > 0 && (
            <SideSection title="Formation">
              {cv.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: 7 }}>
                  <div style={{ fontWeight: 600, fontSize: 8.5, color: '#1a1a2e' }}>{edu.degree}</div>
                  <div style={{ fontSize: 8, color: '#555', marginTop: 1 }}>{edu.school}{edu.year ? ` — ${edu.year}` : ''}</div>
                  {edu.details && <div style={{ fontSize: 7.5, color: '#777', fontStyle: 'italic' }}>{edu.details}</div>}
                </div>
              ))}
            </SideSection>
          )}

          {cv.languages?.length > 0 && (
            <SideSection title="Langues">
              {cv.languages.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 8.5 }}>{l.language}</span>
                  <span style={{ fontSize: 8, color: '#003087' }}>{l.level}</span>
                </div>
              ))}
            </SideSection>
          )}

          {cv.certifications?.length > 0 && (
            <SideSection title="Certifications">
              <ul style={{ paddingLeft: 10, margin: 0 }}>
                {cv.certifications.map((c, i) => <li key={i} style={{ fontSize: 8, marginBottom: 2 }}>{c}</li>)}
              </ul>
            </SideSection>
          )}
        </div>

        {/* MAIN */}
        <div style={{ padding: '14px 20px' }}>
          {cv.summary && (
            <MainSection title="Profil">
              <div style={{ fontSize: 9, color: '#333', lineHeight: 1.5, background: '#f8f9ff', padding: '7px 10px', borderLeft: '2.5px solid #003087' }}>{cv.summary}</div>
            </MainSection>
          )}

          {cv.experiences?.length > 0 && (
            <MainSection title="Expériences professionnelles">
              {cv.experiences.map((exp, i) => (
                <div key={i} style={{ marginBottom: 8, paddingBottom: 7, borderBottom: i < cv.experiences.length - 1 ? '1px solid #eef0f8' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#1a1a2e' }}>{exp.title}</div>
                      <div style={{ fontSize: 8.5, color: '#003087', fontWeight: 500, marginTop: 1 }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</div>
                    </div>
                    {exp.period && (
                      <span style={{ fontSize: 8, color: '#888', background: '#e8eeff', padding: '1px 6px', borderRadius: 8, fontWeight: 500, marginLeft: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>{exp.period}</span>
                    )}
                  </div>
                  {exp.missions?.length > 0 ? (
                    <ul style={{ paddingLeft: 12, marginTop: 3 }}>
                      {exp.missions.map((m, j) => <li key={j} style={{ fontSize: 8.5, color: '#333', marginBottom: 1.5, lineHeight: 1.35 }}>{m}</li>)}
                    </ul>
                  ) : exp.description ? (
                    <p style={{ fontSize: 8.5, color: '#333', marginTop: 3, lineHeight: 1.35 }}>{exp.description}</p>
                  ) : null}
                </div>
              ))}
            </MainSection>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#003087', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '4px', fontSize: 7, letterSpacing: 0.3 }}>
        Document généré via la Plateforme CGI — Confidentiel
      </div>
    </div>
  );
}

function SideSection({ title, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 7.5, fontWeight: 700, color: '#003087', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 6, paddingBottom: 3, borderBottom: '1.5px solid #003087' }}>{title}</div>
      {children}
    </div>
  );
}

function MainSection({ title, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#003087', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, paddingBottom: 3, borderBottom: '1.5px solid #003087' }}>{title}</div>
      {children}
    </div>
  );
}
