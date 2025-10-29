"use client";

import { useEffect, useRef } from 'react';

// Adiciona a biblioteca do Twitter à tipagem global da janela
declare global {
  interface Window {
    twttr?: any;
  }
}

const VideoEmbed = ({ url }: { url: string }) => {
  const embedRef = useRef<HTMLDivElement>(null);
  let isTwitter = false;
  let embedUrl = '';

  if (!url) return null;

  // Lógica para YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoIdMatch = url.match(/(?:v=|\/|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  // Lógica para Twitter/X
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    isTwitter = true;
  }

  useEffect(() => {
    if (isTwitter) {
      // Função para renderizar o Tweet usando a API oficial
      const renderTweet = () => {
        if (window.twttr && window.twttr.widgets && embedRef.current) {
          // Limpa o conteúdo anterior para evitar tweets duplicados
          embedRef.current.innerHTML = '';
          
          // Extrai o ID do tweet da URL
          const tweetId = url.split('/').pop()?.split('?')[0];
          
          if (tweetId) {
            window.twttr.widgets.createTweet(tweetId, embedRef.current, {
              theme: 'light',
              align: 'center',
              conversation: 'none', // Oculta a conversa abaixo do tweet
            });
          }
        }
      };

      // Se a biblioteca do Twitter ainda não foi carregada, carrega o script
      if (!window.twttr) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = renderTweet; // Renderiza o tweet assim que o script carregar
        document.body.appendChild(script);
      } else {
        // Se a biblioteca já existe, apenas renderiza o tweet
        renderTweet();
      }
    }
  }, [isTwitter, url]);

  // Retorna o container para o Tweet
  if (isTwitter) {
    return (
      <div 
        ref={embedRef} 
        className="flex justify-center mb-10 [&>iframe]:rounded-2xl [&>iframe]:shadow-lg"
      >
        {/* O widget do Twitter será renderizado aqui */}
      </div>
    );
  }

  // Retorna o iframe para o YouTube
  if (embedUrl) {
    return (
      <div className="aspect-video w-full mb-10">
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="rounded-2xl shadow-lg"
        ></iframe>
      </div>
    );
  }

  return null;
};

export default VideoEmbed;