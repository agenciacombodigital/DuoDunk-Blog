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
    // 1. Carregar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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
  
  // 3. Redirecionamento de proteção (Client-side check)
  useEffect(() => {
    if (!isLoading) {
      const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
      
      if (isAdminRoute && !isAdmin) {
        router.replace('/admin/login');
      }
      
      if (pathname === '/admin/login' && isAdmin) {
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