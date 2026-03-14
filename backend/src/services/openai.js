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
1. Tu DOIS conserver les informations personnelles du consultant (nom, email, téléphone, etc.) TELLES QUELLES
2. Tu DOIS conserver TOUTES les expériences professionnelles — ne jamais en supprimer
3. Tu DOIS conserver TOUTES les formations
4. REMPLISSAGE DE PAGE: le CV doit occuper TOUTE la page A4. Pour cela:
   - Résumé professionnel: 4 à 5 lignes (phrases complètes et percutantes)
   - Chaque expérience: 4 à 5 missions détaillées (phrases complètes avec verbes d'action et résultats)
   - Compétences: liste exhaustive (minimum 12 compétences)
   - Si le contenu existant est insuffisant pour remplir la page, enrichis les descriptions avec des reformulations professionnelles plus développées
5. Les compétences nouvelles de la fiche doivent être AJOUTÉES aux compétences existantes
6. Les nouvelles missions de la fiche doivent être INTÉGRÉES dans les expériences correspondantes ou ajoutées comme nouvelle expérience`;

  const userPrompt = `Voici les données RÉELLES et COMPLÈTES du consultant extraites de son CV:
${cvJson}

${skillsText ? `Voici les nouvelles compétences/missions à intégrer dans le CV:\n${skillsText}\n` : ''}
${jobTitle ? `\nPoste cible: "${jobTitle}" — optimise le CV pour ce poste.` : '\nMets à jour le CV en intégrant les nouvelles informations.'}

Génère 3 versions différentes du CV. Chaque version DOIT:
- Contenir les VRAIES informations du consultant ci-dessus (nom, expériences, formations, etc.)
- REMPLIR TOUTE LA PAGE A4: résumé de 4-5 lignes, 4-5 missions détaillées par expérience, 12+ compétences
- Reformuler les missions avec des verbes d'action forts et des résultats concrets (quantifiés si possible)
- Adapter la formulation et l'emphase selon l'angle choisi

Angles:
1. "technique" — Met en avant les compétences techniques, outils, technologies. Résumé orienté expertise tech.
2. "experience" — Met en avant les réalisations concrètes et l'impact métier. Résumé orienté valeur ajoutée.
3. "equilibre" — Version équilibrée compétences + expériences. Résumé polyvalent.

Retourne ce JSON exact:
{
  "versions": [
    {
      "type": "technique",
      "title": "Titre court descriptif (ex: Développeur Full Stack — Profil Technique)",
      "angle": "1 phrase décrivant l'angle de cette version",
      "cv_data": {
        "personal_info": { "full_name": "...", "email": "...", "phone": "...", "linkedin": "...", "location": "...", "title": "..." },
        "summary": "Résumé professionnel percutant, max 3 lignes",
        "skills": ["skill1", "skill2", "..."],
        "experiences": [
          { "title": "...", "company": "...", "period": "...", "location": "...", "missions": ["...", "..."] }
        ],
        "education": [{ "degree": "...", "school": "...", "year": "...", "details": "..." }],
        "certifications": ["..."],
        "languages": [{ "language": "...", "level": "..." }]
      }
    },
    { "type": "experience", "title": "...", "angle": "...", "cv_data": { /* données réelles du consultant */ } },
    { "type": "equilibre", "title": "...", "angle": "...", "cv_data": { /* données réelles du consultant */ } }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 10000,
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { extractCVData, generateCVVersions };
