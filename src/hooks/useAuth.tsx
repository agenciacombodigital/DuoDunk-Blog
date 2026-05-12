"use client";

import React, { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    // 1. Carregar sessão inicial
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsAdmin(!!session);
        }
      } catch (error) {
        console.error("Erro ao buscar sessão inicial:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // 2. Monitorar mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAdmin(!!session);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // 3. Redirecionamento de proteção (Client-side check)
  useEffect(() => {
    if (!isLoading) {
      const isLoginRoute = pathname === '/admin/login';
      const isAdminRoute = pathname.startsWith('/admin') && !isLoginRoute;
      
      if (isAdminRoute && !isAdmin) {
        router.replace('/admin/login');
      }
      
      if (isLoginRoute && isAdmin) {
        router.replace('/admin');
      }
    }
  }, [isLoading, isAdmin, pathname, router]);


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