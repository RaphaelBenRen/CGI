const express = require('express');
const multer = require('multer');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../services/supabase');
const { parseFile } = require('../services/parser');
const { extractCVData, generateSkillsSheet } = require('../services/openai');
const { generatePDF, generateSkillsSheetPDF } = require('../services/pdfGenerator');
const { v4: uuidv4 } = require('uuid');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. PDF ou Word uniquement.'));
    }
  },
});

// Upload CV + fiche compétences → crée une session
router.post(
  '/upload',
  requireAuth,
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'skills', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const cvFile = req.files?.cv?.[0];
      if (!cvFile) return res.status(400).json({ error: 'Fichier CV requis' });

      const { job_title } = req.body;
      const userId = req.user.id;
      const sessionId = uuidv4();

      // Upload CV dans Supabase Storage
      const cvPath = `${userId}/${sessionId}/cv-original.${cvFile.originalname.split('.').pop()}`;
      const { error: cvUploadError } = await supabase.storage
        .from('cv-uploads')
        .upload(cvPath, cvFile.buffer, { contentType: cvFile.mimetype });

      if (cvUploadError) throw new Error(`Erreur upload CV: ${cvUploadError.message}`);

      // Upload fiche compétences si présente
      let skillsPath = null;
      if (req.files?.skills?.[0]) {
        const skillsFile = req.files.skills[0];
        skillsPath = `${userId}/${sessionId}/skills.${skillsFile.originalname.split('.').pop()}`;
        await supabase.storage
          .from('skills-sheets')
          .upload(skillsPath, skillsFile.buffer, { contentType: skillsFile.mimetype });
      }

      // Créer la session en base
      const { data: session, error: sessionError } = await supabase
        .from('cv_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          original_cv_path: cvPath,
          skills_sheet_path: skillsPath,
          job_title: job_title || null,
          status: 'uploaded',
        })
        .select()
        .single();

      if (sessionError) throw new Error(sessionError.message);

      res.json({ session_id: sessionId, message: 'Fichiers uploadés avec succès' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Historique des sessions/CV de l'utilisateur
router.get('/history', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('cv_sessions')
    .select(`
      *,
      cv_versions (
        id, version_number, version_type, title, angle, is_selected, created_at
      )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Détails d'une session
router.get('/session/:sessionId', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('cv_sessions')
    .select(`*, cv_versions(*)`)
    .eq('id', req.params.sessionId)
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Session introuvable' });
  res.json(data);
});

// Récupérer une version de CV
router.get('/version/:versionId', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('cv_versions')
    .select('*')
    .eq('id', req.params.versionId)
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Version introuvable' });
  res.json(data);
});

// Mettre à jour une version (édition manuelle)
router.put('/version/:versionId', requireAuth, async (req, res) => {
  const { cv_data } = req.body;
  if (!cv_data) return res.status(400).json({ error: 'cv_data requis' });

  const { data, error } = await supabase
    .from('cv_versions')
    .update({ cv_data, updated_at: new Date().toISOString() })
    .eq('id', req.params.versionId)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Sélectionner une version (marquer comme choisie)
router.post('/version/:versionId/select', requireAuth, async (req, res) => {
  const { versionId } = req.params;

  // Récupérer la session_id de cette version
  const { data: version } = await supabase
    .from('cv_versions')
    .select('session_id')
    .eq('id', versionId)
    .single();

  if (!version) return res.status(404).json({ error: 'Version introuvable' });

  // Déselectionner toutes les versions de la session
  await supabase
    .from('cv_versions')
    .update({ is_selected: false })
    .eq('session_id', version.session_id);

  // Sélectionner celle-ci
  await supabase
    .from('cv_versions')
    .update({ is_selected: true })
    .eq('id', versionId);

  res.json({ message: 'Version sélectionnée' });
});

// Télécharger le PDF d'une version
router.get('/version/:versionId/pdf', requireAuth, async (req, res) => {
  const { data: version, error } = await supabase
    .from('cv_versions')
    .select('*')
    .eq('id', req.params.versionId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !version) return res.status(404).json({ error: 'Version introuvable' });

  try {
    const pdfBuffer = await generatePDF(version.cv_data);

    const fileName = `CV_${(version.cv_data?.personal_info?.full_name || 'consultant').replace(/\s+/g, '_')}_${version.version_type}.pdf`;

    const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// Générer et télécharger une fiche de compétences pour une session
router.get('/session/:sessionId/skills-sheet', requireAuth, async (req, res) => {
  // Récupérer la session avec une version de CV (on prend la première disponible)
  const { data: session, error: sessionError } = await supabase
    .from('cv_sessions')
    .select('*, cv_versions(*)')
    .eq('id', req.params.sessionId)
    .eq('user_id', req.user.id)
    .single();

  if (sessionError || !session) return res.status(404).json({ error: 'Session introuvable' });

  // Prendre la version sélectionnée ou la première disponible
  const versions = session.cv_versions || [];
  const version = versions.find((v) => v.is_selected) || versions[0];

  if (!version) return res.status(404).json({ error: 'Aucune version de CV disponible' });

  try {
    // Générer la fiche de compétences avec GPT
    const sheetData = await generateSkillsSheet(version.cv_data);

    // Générer le PDF
    const pdfBuffer = await generateSkillsSheetPDF(sheetData);

    const name = (version.cv_data?.personal_info?.full_name || 'consultant').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Fiche_Competences_${name}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la génération de la fiche' });
  }
});

module.exports = router;
