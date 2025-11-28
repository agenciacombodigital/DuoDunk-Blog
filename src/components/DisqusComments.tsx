"use client";

import { useEffect } from 'react';

interface DisqusCommentsProps {
  identifier: string;
  title: string;
  url: string;
}

export default function DisqusComments({ identifier, title, url }: DisqusCommentsProps) {
  useEffect(() => {
    // Configuração para desativar as reações (emojis)
    const disqus_config = function () {
      // @ts-ignore
      this.page.url = url;
      // @ts-ignore
      this.page.identifier = identifier;
      // @ts-ignore
      this.page.title = title;
      // @ts-ignore
      this.language = 'pt_BR';
      // ✅ Desativa o recurso de Reações (emojis)
      // @ts-ignore
      this.disable_features = ['reactions']; 
    };

    // Limpar comentários anteriores
    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: disqus_config
      });
    } else {
      // Carregar Disqus pela primeira vez
      // @ts-ignore
      window.disqus_config = disqus_config;

      const script = document.createElement('script');
      script.src = 'https://duodunk.disqus.com/embed.js'; // ✅ Shortname correto
      script.setAttribute('data-timestamp', String(+new Date()));
      (document.head || document.body).appendChild(script);
    }

    return () => {
      // Cleanup se necessário
    };
  }, [identifier, title, url]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">💬 Comentários</h2>
      <div id="disqus_thread"></div>
      <noscript>
        Por favor, habilite JavaScript para visualizar os{' '}
        <a href="https://disqus.com/?ref_noscript">comentários do Disqus.</a>
      </noscript>
    </div>
  );
}

// Declaração de tipo global para TypeScript
declare global {
  interface Window {
    DISQUS: any;
    disqus_config: any;
  }
}