"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isAdmin && !isLoading) {
      router.replace('/admin');
    }
  }, [isAdmin, isLoading, router]);

  // Se estiver carregando ou já estiver logado (aguardando redirect), mostra o loader
  if (isLoading || isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600 mb-4" />
        <p className="text-gray-400 font-inter animate-pulse">Verificando acesso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
        <div className="text-center mb-8">
          <img 
            src="/images/duodunk-logoV2.svg" 
            alt="Duo Dunk Logo" 
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2 font-oswald uppercase tracking-wide">Acesso Admin</h1>
          <p className="text-gray-400 text-sm font-inter">Faça login para acessar o painel administrativo.</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#FA007D',
                  brandAccent: '#C9006A',
                  defaultButtonBackground: '#1f2937',
                  defaultButtonBorder: '#374151',
                  defaultButtonText: '#ffffff',
                  inputBackground: '#111827',
                  inputBorder: '#374151',
                  inputLabelText: '#d1d5db',
                },
              },
            },
          }}
          theme="dark"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'exemplo@duodunk.com.br',
                password_input_placeholder: '••••••••',
                button_label: 'Entrar',
                link_text: 'Já tem uma conta? Faça login',
              },
              sign_up: {
                email_label: 'Seu e-mail',
                password_label: 'Crie uma senha',
                email_input_placeholder: 'exemplo@duodunk.com.br',
                password_input_placeholder: '••••••••',
                button_label: 'Cadastrar',
                link_text: 'Não tem uma conta? Cadastre-se',
              },
            },
          }}
        />
      </div>
    </div>
  );
}