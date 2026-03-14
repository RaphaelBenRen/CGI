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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
      flex: 1;
      align-items: stretch;
    }

    /* SIDEBAR */
    .sidebar {
      background: #f0f4ff;
      padding: 14px 12px;
      border-right: 2px solid #dde8ff;
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

module.exports = { generatePDF };
