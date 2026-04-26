import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fallback: si onAuthStateChange nunca dispara (red caída, etc.), desbloquear UI
    const fallback = setTimeout(() => setLoading(false), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(fallback);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile not created yet by trigger — create it manually
        const { data: authUser } = await supabase.auth.getUser();
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: authUser.user.email,
            full_name:
              authUser.user.user_metadata?.full_name ||
              authUser.user.user_metadata?.name ||
              '',
            role: 'user',
          })
          .select()
          .single();
        setProfile(newProfile);
      } else if (!error) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (customRedirectTo) => {
    const redirectTo =
      customRedirectTo || `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password, fullName) => {
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
  };

  const signOut = () => {
    setUser(null);
    setProfile(null);
    setSession(null);
    // scope:'local' borra el token de localStorage sincrónicamente sin llamada de red,
    // cortando cualquier race condition con TOKEN_REFRESHED en vuelo
    supabase.auth.signOut({ scope: 'local' }).catch(console.error);
  };

  const isEmailVerified = () => user?.email_confirmed_at != null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        isEmailVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
