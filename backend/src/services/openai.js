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
IMPORTANT: Capture TOUTES les expériences, TOUTES les compétences, TOUTES les formations. Ne rien omettre.
Structure JSON attendue:\n${JSON_STRUCTURE}`;

/**
 * Extrait les données structurées d'un CV.
 */
async function extractCVData(parsed) {
  let messages;

  if (parsed && parsed.type === 'image') {
    messages = [{
      role: 'user',
      content: [
        { type: 'text', text: EXTRACT_INSTRUCTION },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${parsed.content}`, detail: 'high' } },
      ],
    }];
  } else {
    const cvText = parsed && parsed.content ? parsed.content : String(parsed);
    messages = [
      { role: 'system', content: EXTRACT_INSTRUCTION },
      { role: 'user', content: `Voici le texte du CV:\n\n${cvText}` },
    ];
  }

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
 * Génère 3 versions de CV selon le mode choisi.
 * mode = 'update'     → intègre nouvelles missions/compétences, CV à jour
 * mode = 'job_target' → optimise pour le poste cible, met en avant ce qui est pertinent
 */
async function generateCVVersions(cvData, skillsText, jobTitle, mode = 'update') {
  const cvJson = JSON.stringify(cvData, null, 2);
  const isJobTarget = mode === 'job_target';

  const systemPrompt = `Tu es un expert RH et rédacteur de CV chez CGI, un des plus grands cabinets de conseil en informatique.
Tu génères des CV professionnels pour des consultants IT.
Réponds UNIQUEMENT avec un JSON valide, sans texte autour, sans markdown.

RÈGLES ABSOLUES:
1. Conserve les informations personnelles du consultant (nom, email, téléphone, etc.) TELLES QUELLES dans les 3 versions
2. Conserve TOUTES les expériences professionnelles dans les 3 versions — ne jamais en supprimer
3. Conserve TOUTES les formations dans les 3 versions
4. REMPLISSAGE DE PAGE: chaque version doit occuper TOUTE la page A4:
   - Résumé professionnel: 4 à 5 phrases complètes et percutantes (texte continu)
   - Chaque expérience: 4 à 5 missions détaillées avec verbes d'action et résultats concrets
   - Compétences: minimum 12, liste exhaustive
5. ${isJobTarget
    ? `MODE OPTIMISATION POSTE: pour le poste "${jobTitle}", réordonne les compétences et expériences en mettant EN PREMIER celles qui sont les plus pertinentes pour ce poste. Reformule les missions pour faire ressortir les mots-clés du domaine.`
    : 'MODE MISE À JOUR: intègre les nouvelles missions et compétences de la fiche dans le CV existant. Les missions les plus récentes apparaissent en premier dans chaque expérience.'}
6. Les 3 versions doivent avoir des cv_data COMPLETS — aucune donnée omise ou placeholder`;

  const userPrompt = `Voici les données RÉELLES et COMPLÈTES du consultant:
${cvJson}

${skillsText ? `Nouvelles compétences/missions à intégrer:\n${skillsText}\n` : ''}
${isJobTarget
  ? `\nPOSTE CIBLE: "${jobTitle}"\nOptimise les 3 versions pour ce poste: mets en avant les expériences et compétences les plus pertinentes, adapte le résumé et les missions pour correspondre au profil recherché.`
  : '\nMets à jour le CV en intégrant toutes les nouvelles informations disponibles.'}

Génère 3 versions en réutilisant EXACTEMENT les données du consultant ci-dessus.
Les 3 versions ont les mêmes personal_info, education, certifications, languages.
Elles diffèrent par: le summary, la formulation des missions, et l'ordre/sélection des compétences selon l'angle.

${isJobTarget ? `Angles pour le poste "${jobTitle}":
1. type "technique" — profil centré sur les compétences techniques les plus pertinentes pour le poste
2. type "experience" — profil centré sur les réalisations et l'impact en lien avec le poste
3. type "equilibre" — profil équilibré optimisé pour le poste` : `Angles de mise à jour:
1. type "technique" — nouvelles compétences techniques mises en avant, missions récentes détaillées
2. type "experience" — nouvelles réalisations et impact métier mis en avant
3. type "equilibre" — version équilibrée intégrant toutes les nouvelles informations`}

Format JSON de réponse:
{
  "versions": [
    { "type": "technique", "title": "string", "angle": "string", "cv_data": { <structure complète avec vraies données> } },
    { "type": "experience", "title": "string", "angle": "string", "cv_data": { <structure complète avec vraies données> } },
    { "type": "equilibre", "title": "string", "angle": "string", "cv_data": { <structure complète avec vraies données> } }
  ]
}

Chaque cv_data: personal_info, summary (4-5 phrases), skills (12+ items), experiences (avec missions détaillées), education, certifications, languages.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
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

module.exports = { extractCVData, generateCVVersions, generateSkillsSheet };
