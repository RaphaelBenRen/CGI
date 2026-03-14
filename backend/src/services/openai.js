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
 * Accepte { type: 'image', content: base64 } ou { type: 'text', content: string } ou string directement.
 */
async function extractCVData(parsed) {
  let messages;

  if (parsed && parsed.type === 'image') {
    // Mode vision : GPT-4o lit l'image du CV
    messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: EXTRACT_INSTRUCTION,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${parsed.content}`,
              detail: 'high',
            },
          },
        ],
      },
    ];
  } else {
    // Mode texte (Word ou fallback)
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
 * Génère 3 versions de CV adaptées à un poste cible
 */
async function generateCVVersions(cvData, skillsText, jobTitle) {
  const cvJson = JSON.stringify(cvData, null, 2);

  const systemPrompt = `Tu es un expert RH et rédacteur de CV chez CGI, un des plus grands cabinets de conseil en informatique.
Tu génères des CV professionnels pour des consultants IT.
Réponds UNIQUEMENT avec un JSON valide, sans texte autour, sans markdown.

RÈGLES ABSOLUES:
1. Tu DOIS conserver les informations personnelles du consultant (nom, email, téléphone, etc.) TELLES QUELLES dans les 3 versions
2. Tu DOIS conserver TOUTES les expériences professionnelles dans les 3 versions — ne jamais en supprimer
3. Tu DOIS conserver TOUTES les formations dans les 3 versions
4. REMPLISSAGE DE PAGE: chaque version de CV doit occuper TOUTE la page A4. Pour cela:
   - Résumé professionnel: 4 à 5 phrases complètes et percutantes (texte continu, pas une liste)
   - Chaque expérience: 4 à 5 missions détaillées (phrases complètes avec verbes d'action et résultats)
   - Compétences: liste exhaustive (minimum 12 compétences)
   - Si le contenu existant est insuffisant pour remplir la page, enrichis les descriptions avec des reformulations professionnelles plus développées
5. Les compétences nouvelles de la fiche doivent être AJOUTÉES aux compétences existantes
6. Les nouvelles missions de la fiche doivent être INTÉGRÉES dans les expériences correspondantes ou ajoutées comme nouvelle expérience
7. Les 3 versions doivent avoir des cv_data COMPLETS — aucune donnée ne doit être omise ou remplacée par des placeholders`;

  const userPrompt = `Voici les données RÉELLES et COMPLÈTES du consultant extraites de son CV:
${cvJson}

${skillsText ? `Voici les nouvelles compétences/missions à intégrer dans le CV:\n${skillsText}\n` : ''}
${jobTitle ? `\nPoste cible: "${jobTitle}" — optimise le CV pour ce poste.` : '\nMets à jour le CV en intégrant les nouvelles informations.'}

Génère 3 versions différentes du CV en réutilisant EXACTEMENT les données ci-dessus.
Les 3 versions partagent les mêmes données de base (personal_info, education, certifications, languages) et reformulent uniquement le summary, les missions des expériences et l'ordre/sélection des compétences selon l'angle.

Angles:
1. type "technique" — résumé et missions reformulés pour mettre en avant l'expertise tech et les outils
2. type "experience" — résumé et missions reformulés pour mettre en avant les réalisations et l'impact métier
3. type "equilibre" — version équilibrée entre compétences techniques et expériences

Format de réponse JSON:
{
  "versions": [
    { "type": "technique", "title": "string", "angle": "string", "cv_data": { <structure complète> } },
    { "type": "experience", "title": "string", "angle": "string", "cv_data": { <structure complète> } },
    { "type": "equilibre", "title": "string", "angle": "string", "cv_data": { <structure complète> } }
  ]
}

Chaque cv_data contient: personal_info (identique aux données source), summary (4-5 phrases), skills (tableau, 12 minimum), experiences (tableau avec title/company/period/location/missions), education, certifications, languages.`;

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

module.exports = { extractCVData, generateCVVersions };
