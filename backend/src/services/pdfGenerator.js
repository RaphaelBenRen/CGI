const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Génère un PDF à partir des données structurées du CV
 */
async function generatePDF(cvData) {
  const html = buildCVHTML(cvData);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      pageRanges: '1',
    });
    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCVHTML(cvData) {
  const p = cvData.personal_info || {};
  const skills = cvData.skills || [];
  const experiences = cvData.experiences || [];
  const education = cvData.education || [];
  const certifications = cvData.certifications || [];
  const languages = cvData.languages || [];

  const skillsHTML = skills
    .map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`)
    .join('');

  const experiencesHTML = experiences
    .map(
      (exp) => `
    <div class="experience">
      <div class="exp-header">
        <div>
          <div class="exp-title">${escapeHtml(exp.title)}</div>
          <div class="exp-company">${escapeHtml(exp.company)}${exp.location ? ` — ${escapeHtml(exp.location)}` : ''}</div>
        </div>
        <div class="exp-period">${escapeHtml(exp.period)}</div>
      </div>
      ${
        exp.missions && exp.missions.length > 0
          ? `<ul class="mission-list">${exp.missions.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>`
          : exp.description
          ? `<p class="exp-desc">${escapeHtml(exp.description)}</p>`
          : ''
      }
    </div>`
    )
    .join('');

  const educationHTML = education
    .map(
      (edu) => `
    <div class="edu-item">
      <div class="edu-degree">${escapeHtml(edu.degree)}</div>
      <div class="edu-school">${escapeHtml(edu.school)}${edu.year ? ` — ${escapeHtml(edu.year)}` : ''}</div>
      ${edu.details ? `<div class="edu-details">${escapeHtml(edu.details)}</div>` : ''}
    </div>`
    )
    .join('');

  const certificationsHTML =
    certifications.length > 0
      ? `<section class="section">
      <h2 class="section-title">Certifications</h2>
      <ul class="cert-list">${certifications.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
    </section>`
      : '';

  const languagesHTML =
    languages.length > 0
      ? `<section class="section">
      <h2 class="section-title">Langues</h2>
      <div class="languages-grid">
        ${languages.map((l) => `<div class="lang-item"><span class="lang-name">${escapeHtml(l.language)}</span><span class="lang-level">${escapeHtml(l.level)}</span></div>`).join('')}
      </div>
    </section>`
      : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 210mm;
      height: 297mm;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5px;
      color: #2d2d2d;
      background: white;
      line-height: 1.4;
    }
    .page {
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
    }

    /* HEADER */
    .header {
      background: linear-gradient(135deg, #003087 0%, #0050c8 100%);
      color: white;
      padding: 14px 28px 10px;
      flex-shrink: 0;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .header-title {
      font-size: 11px;
      color: #a8c4ff;
      margin-top: 2px;
    }
    .cgi-badge {
      background: rgba(255,255,255,0.15);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .contact-bar {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .contact-item {
      font-size: 9px;
      color: #c8daff;
    }

    /* BODY LAYOUT */
    .body-grid {
      display: grid;
      grid-template-columns: 175px 1fr;
      grid-template-rows: 1fr;
      flex: 1;
      min-height: 0;
    }

    /* SIDEBAR */
    .sidebar {
      background: #f0f4ff;
      padding: 14px 12px;
      border-right: 2px solid #dde8ff;
      align-self: stretch;
    }
    .sidebar-section { margin-bottom: 12px; }
    .sidebar-title {
      font-size: 7.5px;
      font-weight: 700;
      color: #003087;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1.5px solid #003087;
    }
    .skill-tag {
      display: inline-block;
      background: #003087;
      color: white;
      padding: 2px 6px;
      border-radius: 2px;
      font-size: 8px;
      margin: 1.5px 1.5px 1.5px 0;
      font-weight: 500;
    }
    .edu-item { margin-bottom: 7px; }
    .edu-degree { font-weight: 600; font-size: 8.5px; color: #1a1a2e; }
    .edu-school { font-size: 8px; color: #555; margin-top: 1px; }
    .edu-details { font-size: 7.5px; color: #777; font-style: italic; }
    .lang-item { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .lang-name { font-weight: 600; font-size: 8.5px; }
    .lang-level { font-size: 8px; color: #003087; }
    .cert-list { padding-left: 10px; }
    .cert-list li { font-size: 8px; margin-bottom: 2px; }

    /* MAIN CONTENT */
    .main-content { padding: 14px 20px; }
    .section { margin-bottom: 10px; }
    .section-title {
      font-size: 9px;
      font-weight: 700;
      color: #003087;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1.5px solid #003087;
    }
    .summary-text {
      font-size: 9px;
      color: #333;
      line-height: 1.5;
      background: #f8f9ff;
      padding: 7px 10px;
      border-left: 2.5px solid #003087;
    }
    .experience {
      margin-bottom: 8px;
      padding-bottom: 7px;
      border-bottom: 1px solid #eef0f8;
    }
    .experience:last-child { border-bottom: none; margin-bottom: 0; }
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3px;
    }
    .exp-title { font-size: 9.5px; font-weight: 700; color: #1a1a2e; }
    .exp-company { font-size: 8.5px; color: #003087; font-weight: 500; margin-top: 1px; }
    .exp-period {
      font-size: 8px;
      color: #888;
      white-space: nowrap;
      background: #e8eeff;
      padding: 1px 6px;
      border-radius: 8px;
      font-weight: 500;
      margin-left: 8px;
      flex-shrink: 0;
    }
    .mission-list { padding-left: 12px; margin-top: 3px; }
    .mission-list li { font-size: 8.5px; color: #333; margin-bottom: 1.5px; line-height: 1.35; }
    .exp-desc { font-size: 8.5px; color: #333; margin-top: 3px; line-height: 1.35; }

    /* FOOTER */
    .footer {
      background: #003087;
      color: rgba(255,255,255,0.6);
      text-align: center;
      padding: 4px;
      font-size: 7px;
      letter-spacing: 0.3px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="header-name">${escapeHtml(p.full_name || 'Consultant')}</div>
        <div class="header-title">${escapeHtml(p.title || '')}</div>
      </div>
      <div class="cgi-badge">CGI</div>
    </div>
    <div class="contact-bar">
      ${p.email ? `<div class="contact-item"><span class="contact-icon">✉</span>${escapeHtml(p.email)}</div>` : ''}
      ${p.phone ? `<div class="contact-item"><span class="contact-icon">☎</span>${escapeHtml(p.phone)}</div>` : ''}
      ${p.location ? `<div class="contact-item"><span class="contact-icon">⚑</span>${escapeHtml(p.location)}</div>` : ''}
      ${p.linkedin ? `<div class="contact-item"><span class="contact-icon">in</span>${escapeHtml(p.linkedin)}</div>` : ''}
    </div>
  </div>

  <!-- BODY -->
  <div class="body-grid">

    <!-- SIDEBAR -->
    <div class="sidebar">
      ${skills.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Compétences</div>
        <div>${skillsHTML}</div>
      </div>` : ''}

      ${education.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Formation</div>
        ${educationHTML}
      </div>` : ''}

      ${languages.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Langues</div>
        ${languages.map((l) => `<div class="lang-item"><span class="lang-name">${escapeHtml(l.language)}</span><span class="lang-level">${escapeHtml(l.level)}</span></div>`).join('')}
      </div>` : ''}

      ${certifications.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Certifications</div>
        <ul class="cert-list">${certifications.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
      </div>` : ''}
    </div>

    <!-- MAIN -->
    <div class="main-content">
      ${cvData.summary ? `
      <section class="section">
        <h2 class="section-title">Profil</h2>
        <div class="summary-text">${escapeHtml(cvData.summary)}</div>
      </section>` : ''}

      ${experiences.length > 0 ? `
      <section class="section">
        <h2 class="section-title">Expériences professionnelles</h2>
        ${experiencesHTML}
      </section>` : ''}
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">Document généré via la Plateforme CGI — Confidentiel</div>

</div>
</body>
</html>`;
}

/**
 * Génère un PDF de fiche de compétences
 */
async function generateSkillsSheetPDF(data) {
  const html = buildSkillsSheetHTML(data);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}

function buildSkillsSheetHTML(data) {
  const p = data.personal_info || {};
  const competTech = data.competences_techniques || [];
  const competFunc = data.competences_fonctionnelles || [];
  const missions = data.missions_recentes || [];
  const formations = data.formations || [];
  const certifications = data.certifications || [];
  const langues = data.langues || [];
  const newMissions = data.nouvelles_missions_a_ajouter || [];
  const newCompetences = data.nouvelles_competences_a_ajouter || [];

  const skillTag = (s) => `<span style="display:inline-block;background:#003087;color:#fff;padding:2px 8px;font-size:8px;margin:2px 2px 2px 0;font-weight:500">${escapeHtml(s)}</span>`;
  const emptyTag = (s) => `<span style="display:inline-block;background:#f0f2f5;color:#888;border:1px dashed #c0c8d8;padding:2px 8px;font-size:8px;margin:2px 2px 2px 0;font-style:italic">${escapeHtml(s)}</span>`;

  const sectionTitle = (t, color = '#003087') =>
    `<div style="font-size:8px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1.2px;padding-bottom:3px;border-bottom:1.5px solid ${color};margin-bottom:8px">${t}</div>`;

  const missionsHTML = missions.map((m) => `
    <div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #eef0f8">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">
        <div>
          <div style="font-size:9px;font-weight:700;color:#1a1a2e">${escapeHtml(m.poste)}</div>
          <div style="font-size:8px;color:#003087;font-weight:500">${escapeHtml(m.entreprise)}</div>
        </div>
        <span style="font-size:7.5px;color:#888;background:#e8eeff;padding:1px 6px;white-space:nowrap;margin-left:8px">${escapeHtml(m.periode)}</span>
      </div>
      <ul style="padding-left:12px;margin:0">
        ${(m.missions || []).map((ms) => `<li style="font-size:8px;color:#333;margin-bottom:1.5px;line-height:1.4">${escapeHtml(ms)}</li>`).join('')}
      </ul>
    </div>`).join('');

  const newMissionsHTML = newMissions.map((m) => `
    <div style="margin-bottom:10px;padding:10px;background:#fffbe6;border:1px dashed #f0c040">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <div>
          <div style="font-size:9px;font-weight:700;color:#1a1a2e">${escapeHtml(m.poste)}</div>
          <div style="font-size:8px;color:#555">${escapeHtml(m.entreprise)}</div>
        </div>
        <span style="font-size:7.5px;color:#888;padding:1px 6px;background:#f5f5f5">${escapeHtml(m.periode)}</span>
      </div>
      <ul style="padding-left:12px;margin:0">
        ${(m.missions || []).map((ms) => `<li style="font-size:8px;color:#555;margin-bottom:2px;line-height:1.4;font-style:italic">${escapeHtml(ms)}</li>`).join('')}
      </ul>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin:0;padding:0;box-sizing:border-box; }
    html,body { width:210mm;font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#2d2d2d;background:#fff;line-height:1.4; }
  </style>
</head>
<body>

<!-- HEADER -->
<div style="background:linear-gradient(135deg,#003087 0%,#0050c8 100%);color:#fff;padding:14px 28px 10px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="font-size:18px;font-weight:700;letter-spacing:0.3px">${escapeHtml(p.full_name || 'Consultant')}</div>
      ${p.title ? `<div style="font-size:10px;color:#a8c4ff;margin-top:2px">${escapeHtml(p.title)}</div>` : ''}
      ${p.email ? `<div style="font-size:8.5px;color:#c8daff;margin-top:4px">✉ ${escapeHtml(p.email)}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div style="background:rgba(255,255,255,0.15);padding:4px 10px;border:1px solid rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:1px">CGI</div>
      <div style="font-size:8px;color:rgba(255,255,255,0.6);margin-top:6px;font-style:italic">Fiche de compétences</div>
    </div>
  </div>
</div>

<!-- BODY -->
<div style="display:grid;grid-template-columns:175px 1fr;grid-template-rows:1fr;min-height:0">

  <!-- SIDEBAR -->
  <div style="background:#f0f4ff;padding:14px 12px;border-right:2px solid #dde8ff;align-self:stretch">

    ${competTech.length > 0 ? `
    <div style="margin-bottom:12px">
      ${sectionTitle('Compétences techniques')}
      <div>${competTech.map(skillTag).join('')}</div>
    </div>` : ''}

    ${competFunc.length > 0 ? `
    <div style="margin-bottom:12px">
      ${sectionTitle('Compétences fonctionnelles')}
      <div>${competFunc.map(skillTag).join('')}</div>
    </div>` : ''}

    ${newCompetences.length > 0 ? `
    <div style="margin-bottom:12px">
      ${sectionTitle('Nouvelles compétences', '#b08000')}
      <div style="font-size:7.5px;color:#888;font-style:italic;margin-bottom:4px">À compléter / à ajouter au CV</div>
      <div>${newCompetences.map(emptyTag).join('')}</div>
    </div>` : ''}

    ${formations.length > 0 ? `
    <div style="margin-bottom:12px">
      ${sectionTitle('Formation')}
      ${formations.map((f) => `
        <div style="margin-bottom:7px">
          <div style="font-weight:600;font-size:8px;color:#1a1a2e">${escapeHtml(f.diplome)}</div>
          <div style="font-size:7.5px;color:#555;margin-top:1px">${escapeHtml(f.etablissement)}${f.annee ? ` — ${escapeHtml(f.annee)}` : ''}</div>
        </div>`).join('')}
    </div>` : ''}

    ${langues.length > 0 ? `
    <div style="margin-bottom:12px">
      ${sectionTitle('Langues')}
      ${langues.map((l) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-weight:600;font-size:8px">${escapeHtml(l.langue)}</span>
          <span style="font-size:7.5px;color:#003087">${escapeHtml(l.niveau)}</span>
        </div>`).join('')}
    </div>` : ''}

    ${certifications.length > 0 ? `
    <div>
      ${sectionTitle('Certifications')}
      <ul style="padding-left:10px;margin:0">
        ${certifications.map((c) => `<li style="font-size:7.5px;margin-bottom:2px">${escapeHtml(c)}</li>`).join('')}
      </ul>
    </div>` : ''}
  </div>

  <!-- MAIN -->
  <div style="padding:14px 20px">

    ${missionsHTML ? `
    <div style="margin-bottom:12px">
      ${sectionTitle('Missions récentes (extraites du CV)')}
      ${missionsHTML}
    </div>` : ''}

    <div>
      ${sectionTitle('Nouvelles missions à ajouter au CV', '#b08000')}
      <div style="font-size:8px;color:#888;font-style:italic;margin-bottom:10px;padding:6px 10px;background:#fffbe6;border-left:2px solid #f0c040">
        Complétez les sections ci-dessous avec vos nouvelles missions, puis soumettez cette fiche pour mettre votre CV à jour.
      </div>
      ${newMissionsHTML || '<div style="font-size:8px;color:#aaa;font-style:italic">Aucune nouvelle mission définie.</div>'}
    </div>
  </div>
</div>

<!-- FOOTER -->
<div style="background:#003087;color:rgba(255,255,255,0.6);text-align:center;padding:4px;font-size:7px;letter-spacing:0.3px">
  Document généré via la Plateforme CGI — Fiche de compétences confidentielle
</div>

</body>
</html>`;
}

module.exports = { generatePDF, generateSkillsSheetPDF };
