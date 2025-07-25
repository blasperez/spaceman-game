import express from 'express';
import { supabase } from '../supabase/supabase.js';

const router = express.Router();

// Google OAuth callback handler
router.get('/auth/callback', async (req, res) => {
  try {
    console.log('🔍 Processing Google OAuth callback...');
    
    const code = req.query.code;
    if (!code) {
      console.error('❌ No authorization code provided');
      return res.redirect('/login?error=no_code');
    }

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Error exchanging code for session:', error);
      return res.redirect('/login?error=exchange_failed');
    }

    if (data.session) {
      console.log('✅ Google OAuth successful for user:', data.user.email);
      
      // Create or update user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || 'Usuario',
          avatar_url: data.user.user_metadata?.avatar_url,
          provider: 'google',
          balance: 1000.00,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Error creating/updating profile:', profileError);
        // Continue anyway, user can still login
      }

      // Redirect to app with success
      res.redirect(`/?auth=success&user=${encodeURIComponent(JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || 'Usuario',
        avatar: data.user.user_metadata?.avatar_url
      }))}`);
    } else {
      console.error('❌ No session data received');
      res.redirect('/login?error=no_session');
    }
  } catch (error) {
    console.error('❌ Auth callback error:', error);
    res.redirect('/login?error=server_error');
  }
});

// Check authentication status
router.get('/auth/status', async (req, res) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    res.json({ 
      authenticated: !!session?.user,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || 'Usuario',
        avatar: session.user.user_metadata?.avatar_url
      } : null
    });
  } catch (error) {
    console.error('❌ Auth status check error:', error);
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

// Logout endpoint
router.post('/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;
