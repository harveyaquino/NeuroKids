import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = inicializando, null = sin sesión, objeto = con sesión
  const [user, setUser]       = useState(undefined);
  const [profile, setProfile] = useState(null);
  const activatedUserId       = useRef(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null;
        activatedUserId.current = u?.id ?? null;
        setUser(u);
        if (u) {
          loadProfile(u.id);
        } else {
          setProfile(null);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (activatedUserId.current !== userId) return; // ya cambió de usuario

      if (data) {
        setProfile(data);
        return;
      }

      // El perfil no existe aún — créalo
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user || activatedUserId.current !== userId) return;

      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: authData.user.email,
          full_name:
            authData.user.user_metadata?.full_name ||
            authData.user.user_metadata?.name ||
            '',
          role: 'user',
        })
        .select()
        .single();

      if (activatedUserId.current === userId) setProfile(newProfile);
    } catch (err) {
      console.error('loadProfile:', err);
    }
  }

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUpWithEmail(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
    return data;
  }

  async function signInWithGoogle(redirectTo) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo || `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  function signOut() {
    activatedUserId.current = null;
    setUser(null);
    setProfile(null);
    supabase.auth.signOut({ scope: 'local' }).catch(console.error);
  }

  return (
    <AuthContext.Provider
      value={{
        user:            user === undefined ? null : user,
        profile,
        loading:         user === undefined,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        isEmailVerified: () => !!(user?.email_confirmed_at),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
