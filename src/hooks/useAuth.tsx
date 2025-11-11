import React, { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean; // Adicionamos esta flag para controle de acesso
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Carregar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Por enquanto, consideramos qualquer usuário logado como admin para o painel
      // Em um sistema real, usaríamos RLS ou roles no banco de dados.
      setIsAdmin(!!session); 
      setIsLoading(false);
    });

    // 2. Monitorar mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdmin(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Se estiver carregando, mostre um loader global
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const value = {
    session,
    user,
    isLoading,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};