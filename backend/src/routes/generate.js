const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../services/supabase');
const { parseFile } = require('../services/parser');
const { extractCVData, generateCVVersions } = require('../services/openai');

// Lancer la génération des 3 versions de CV pour une session
router.post('/:sessionId', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  // Vérifier que la session existe et appartient à l'utilisateur
  const { data: session, error: sessionError } = await supabase
    .from('cv_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  // Mettre à jour le statut
  await supabase
    .from('cv_sessions')
    .update({ status: 'processing' })
    .eq('id', sessionId);

  try {
    // Récupérer le CV depuis Supabase Storage
    const { data: cvFileData, error: cvDownloadError } = await supabase.storage
      .from('cv-uploads')
      .download(session.original_cv_path);

    if (cvDownloadError) throw new Error(`Erreur téléchargement CV: ${cvDownloadError.message}`);

    const cvBuffer = Buffer.from(await cvFileData.arrayBuffer());
    const ext = session.original_cv_path.split('.').pop().toLowerCase();
    const cvMimetype = ext === 'pdf' ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Parser le CV
    const cvText = await parseFile(cvBuffer, cvMimetype);

    // Parser la fiche de compétences si présente
    let skillsText = null;
    if (session.skills_sheet_path) {
      const { data: skillsFileData } = await supabase.storage
        .from('skills-sheets')
        .download(session.skills_sheet_path);

      if (skillsFileData) {
        const skillsBuffer = Buffer.from(await skillsFileData.arrayBuffer());
        const skillsExt = session.skills_sheet_path.split('.').pop().toLowerCase();
        const skillsMimetype = skillsExt === 'pdf' ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        skillsText = await parseFile(skillsBuffer, skillsMimetype);
      }
    }

    // Extraire les données structurées du CV avec GPT
    const cvData = await extractCVData(cvText);

    // Générer les 3 versions
    const result = await generateCVVersions(cvData, skillsText, session.job_title);
    const versions = result.versions || [];

    // Supprimer les anciennes versions si re-génération
    await supabase.from('cv_versions').delete().eq('session_id', sessionId);

    // Sauvegarder les 3 versions en base
    const versionsToInsert = versions.map((v, index) => ({
      session_id: sessionId,
      user_id: userId,
      version_number: index + 1,
      version_type: v.type,
      title: v.title,
      angle: v.angle,
      cv_data: v.cv_data,
      is_selected: false,
    }));

    const { data: savedVersions, error: insertError } = await supabase
      .from('cv_versions')
      .insert(versionsToInsert)
      .select();

    if (insertError) throw new Error(insertError.message);

    // Mettre à jour le statut de la session
    await supabase
      .from('cv_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId);

    res.json({ versions: savedVersions });
  } catch (err) {
    console.error('Erreur génération:', err);
    await supabase
      .from('cv_sessions')
      .update({ status: 'error' })
      .eq('id', sessionId);

    res.status(500).json({ error: err.message || 'Erreur lors de la génération des CV' });
  }
});

module.exports = router;
