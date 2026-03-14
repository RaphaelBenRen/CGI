const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');
const { requireAuth } = require('../middleware/auth');

// Inscription
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // Créer le profil consultant
  if (data.user) {
    await supabase.from('consultant_profiles').insert({
      user_id: data.user.id,
      full_name: full_name || '',
    });
  }

  res.json({ message: 'Compte créé avec succès. Vérifiez votre email.', user: data.user });
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

  res.json({ session: data.session, user: data.user });
});

// Déconnexion
router.post('/logout', requireAuth, async (req, res) => {
  await supabase.auth.signOut();
  res.json({ message: 'Déconnexion réussie' });
});

// Profil utilisateur
router.get('/me', requireAuth, async (req, res) => {
  const { data: profile } = await supabase
    .from('consultant_profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  res.json({ user: req.user, profile });
});

module.exports = router;
