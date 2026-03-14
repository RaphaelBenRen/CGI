const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const JSON_STRUCTURE = `{
  "personal_info": { "full_name": "", "email": "", "phone": "", "linkedin": "", "location": "", "title": "" },
  "summary": "",
  "skills": [],
  "experiences": [{ "title": "", "company": "", "period": "", "location": "", "description": "", "missions": [] }],
  "education": [{ "degree": "", "school": "", "year": "", "details": "" }],
  "certifications": [],
  "languages": [{ "language": "", "level": "" }]
}`;

const EXTRACT_INSTRUCTION = `Tu es un expert en analyse de CV. Extrais TOUTES les informations visibles et retourne UNIQUEMENT un JSON valide sans texte autour, sans markdown.
IMPORTANT:
- Capture TOUTES les expériences, TOUTES les compétences, TOUTES les formations. Ne rien omettre.
- Le champ "skills" doit être une liste PLATE de strings courts et individuels (ex: ["JavaScript", "React Native", "Figma", "SCRUM"]). Ne regroupe PAS les compétences en catégories. Chaque outil, langage ou méthode est un élément séparé.
- Pour chaque expérience, le champ "missions" doit être une liste de strings (une mission par string).
Structure JSON attendue:\n${JSON_STRUCTURE}`;

/**
 * Extrait les données structurées d'un CV (texte uniquement).
 */
async function extractCVData(parsed) {
  const cvText = parsed && parsed.content ? parsed.content : String(parsed);
  const messages = [
    { role: 'system', content: EXTRACT_INSTRUCTION },
    { role: 'user', content: `Voici le texte du CV:\n\n${cvText}` },
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 4000,
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Mode mise à jour : envoie les deux textes bruts directement à GPT.
 * GPT lit les deux documents, détecte ce qui est nouveau dans la fiche
 * et produit UN SEUL CV mis à jour sans rien inventer.
 */
async function generateUpdatedCV(cvRawText, skillsRawText) {
  const JSON_CV_STRUCTURE = `{
  "personal_info": { "full_name": "", "email": "", "phone": "", "linkedin": "", "location": "", "title": "" },
  "summary": "",
  "skills": ["string", ...],
  "experiences": [{ "title": "", "company": "", "period": "", "location": "", "missions": ["string", ...] }],
  "education": [{ "degree": "", "school": "", "year": "", "details": "" }],
  "certifications": [],
  "languages": [{ "language": "", "level": "" }]
}`;

  const prompt = `Tu es un expert RH chez CGI. Tu reçois deux documents texte:
1. Le CV actuel d'un consultant
2. Une fiche de compétences avec ses nouvelles missions récentes

CV ACTUEL:
${cvRawText}

---

FICHE DE COMPÉTENCES (nouvelles missions à intégrer):
${skillsRawText}

---

MISSION: Produis UN SEUL CV mis à jour en appliquant ces règles STRICTES:

1. INFORMATIONS PERSONNELLES: Copie EXACTEMENT depuis le CV actuel (nom, email, téléphone, titre, localisation). Ne modifie rien.
2. FORMATION: Copie EXACTEMENT depuis le CV actuel. Ne modifie rien.
3. LANGUES & CERTIFICATIONS: Copie EXACTEMENT depuis le CV actuel.
4. EXPÉRIENCES EXISTANTES: Garde-les TOUTES avec leurs missions d'origine exactes. Ne reformule pas, ne remplace pas.
5. NOUVELLES EXPÉRIENCES: Lis la fiche. Pour chaque expérience/projet de la fiche qui N'EXISTE PAS dans le CV → ajoute-la EN PREMIER dans la liste (les plus récentes d'abord). Utilise les missions exactes mentionnées dans la fiche.
6. COMPÉTENCES: Commence par toutes les compétences du CV. Ajoute les nouvelles compétences/outils trouvés dans la fiche. Liste PLATE de strings courts individuels (ex: "JavaScript", "Figma", "SCRUM"). Aucune catégorie.
7. RÉSUMÉ: Écris 4-5 phrases qui reflètent le profil complet mis à jour.
8. N'INVENTE RIEN: Toute information (nom d'entreprise, mission, outil) doit provenir de l'un des deux documents.

Retourne UNIQUEMENT ce JSON valide (sans markdown, sans texte autour):
{ "versions": [{ "type": "equilibre", "title": "CV mis à jour", "angle": "Intégration des nouvelles missions et compétences", "cv_data": ${JSON_CV_STRUCTURE} }] }`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 8000,
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Génère 3 versions de CV pour le mode job_target.
 */
async function generateCVVersions(cvData, skillsText, jobTitle, mode = 'update') {
  const isJobTarget = mode === 'job_target';

  // Données fixes : copiées verbatim dans les 3 versions
  const fixedJson = JSON.stringify({
    personal_info: cvData.personal_info,
    education: cvData.education,
    certifications: cvData.certifications,
    languages: cvData.languages,
  }, null, 2);

  // Données sources : expériences et compétences existantes
  const sourceExperiences = JSON.stringify(cvData.experiences || [], null, 2);
  const sourceSkills = JSON.stringify(cvData.skills || [], null, 2);
  const sourceSummary = cvData.summary || '';

  const systemPrompt = `Tu es un expert RH et rédacteur de CV chez CGI.
Réponds UNIQUEMENT avec un JSON valide, sans texte autour, sans markdown.

RÈGLE N°1 — DONNÉES FIXES (identiques dans les 3 versions, copie mot pour mot):
${fixedJson}

RÈGLE N°2 — NE JAMAIS INVENTER: utilise uniquement les informations fournies. Zéro invention de noms, entreprises, dates, compétences ou missions absentes des données.

RÈGLE N°3 — CONTENU: résumé 4-5 phrases, chaque expérience 4-5 missions détaillées, minimum 12 compétences.`;

  let userPrompt;

  if (isJobTarget) {
    userPrompt = `CV EXISTANT À RÉORGANISER:
Expériences: ${sourceExperiences}
Compétences: ${sourceSkills}
Résumé actuel: ${sourceSummary}

POSTE CIBLE: "${jobTitle}"

MISSION: Génère 3 versions en réorganisant uniquement l'ordre et la formulation des éléments existants pour mettre en avant ce qui est le plus pertinent pour "${jobTitle}". Ne supprime aucune expérience.

Angles:
1. type "technique" — compétences techniques les plus pertinentes pour "${jobTitle}" en premier
2. type "experience" — réalisations et impact en lien avec "${jobTitle}" mis en avant
3. type "equilibre" — profil équilibré optimisé pour "${jobTitle}"

Format:
{ "versions": [
  { "type": "technique", "title": "...", "angle": "...", "cv_data": { "personal_info": <COPIE VERBATIM>, "summary": "...", "skills": [...], "experiences": [...], "education": <COPIE VERBATIM>, "certifications": <COPIE VERBATIM>, "languages": <COPIE VERBATIM> } },
  { "type": "experience", ... },
  { "type": "equilibre", ... }
] }`;
  } else {
    // Mode update : 1 seul CV mis à jour
    // Extraire les labels des expériences existantes pour déduplication explicite
    const existingExpLabels = (cvData.experiences || [])
      .map((e, i) => `${i + 1}. "${e.title}" chez "${e.company}" (${e.period})`)
      .join('\n');

    userPrompt = `EXPÉRIENCES DÉJÀ PRÉSENTES DANS LE CV (ne pas dupliquer, conserver telles quelles):
${existingExpLabels}

COMPÉTENCES DÉJÀ PRÉSENTES DANS LE CV:
${sourceSkills}

RÉSUMÉ ACTUEL:
${sourceSummary}

${skillsText
  ? `FICHE DE COMPÉTENCES / NOUVELLES INFORMATIONS À ANALYSER:
${skillsText}

MISSION EXACTE — génère UN SEUL CV mis à jour:
1. Lis toutes les expériences/projets mentionnés dans la fiche ci-dessus
2. Pour chacun, vérifie si son titre ET son entreprise correspondent à un élément de la liste "EXPÉRIENCES DÉJÀ PRÉSENTES" → si NON, c'est une NOUVELLE expérience à ajouter EN PREMIER
3. Ajoute toutes les compétences/outils de la fiche qui ne sont pas déjà dans la liste "COMPÉTENCES DÉJÀ PRÉSENTES" → liste individuelle de strings courts
4. Mets à jour le résumé (4-5 phrases) pour mentionner les nouvelles missions et compétences
5. Conserve EXACTEMENT les expériences existantes avec toutes leurs missions d'origine`
  : `MISSION: Génère UN SEUL CV avec le résumé enrichi (4-5 phrases). Conserve toutes les données factuelles.`}

Format — retourne UN SEUL élément dans le tableau versions:
{ "versions": [
  { "type": "equilibre", "title": "CV mis à jour", "angle": "Intégration des nouvelles missions et compétences", "cv_data": { "personal_info": <COPIE VERBATIM des données fixes du system prompt>, "summary": "4-5 phrases", "skills": ["compétence1", "compétence2", ...toutes existantes + nouvelles individuelles...], "experiences": [{ "title": "...", "company": "...", "period": "...", "location": "...", "missions": ["..."] }, ...nouvelles en PREMIER puis toutes les existantes...], "education": <COPIE VERBATIM>, "certifications": <COPIE VERBATIM>, "languages": <COPIE VERBATIM> } }
] }`;
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: isJobTarget ? 0.3 : 0.2,
    max_tokens: 16000,
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Génère une fiche de compétences structurée depuis les données du CV.
 * Retourne { personal_info, competences_techniques, competences_fonctionnelles,
 *            missions_recentes, formations, certifications, langues, nouvelles_missions_a_ajouter }
 */
async function generateSkillsSheet(cvData) {
  const cvJson = JSON.stringify(cvData, null, 2);

  const prompt = `Tu es un expert RH chez CGI. À partir du CV ci-dessous, génère une fiche de compétences structurée.
Cette fiche servira au consultant pour documenter ses nouvelles missions et la soumettre pour mise à jour de son CV.

CV source:
${cvJson}

Retourne UNIQUEMENT ce JSON valide:
{
  "personal_info": { "full_name": "string", "title": "string", "email": "string" },
  "competences_techniques": ["liste des compétences techniques extraites du CV"],
  "competences_fonctionnelles": ["compétences métier, gestion de projet, etc."],
  "missions_recentes": [
    { "entreprise": "string", "periode": "string", "poste": "string", "missions": ["mission 1", "mission 2", "..."] }
  ],
  "formations": [{ "diplome": "string", "etablissement": "string", "annee": "string" }],
  "certifications": ["liste des certifications"],
  "langues": [{ "langue": "string", "niveau": "string" }],
  "nouvelles_missions_a_ajouter": [
    { "entreprise": "À compléter", "periode": "À compléter", "poste": "À compléter", "missions": ["À décrire..."] }
  ],
  "nouvelles_competences_a_ajouter": ["À compléter..."]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 4000,
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { extractCVData, generateUpdatedCV, generateCVVersions, generateSkillsSheet };
