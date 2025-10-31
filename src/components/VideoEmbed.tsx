"use client";

import { useEffect, useRef } from 'react';

// Adiciona as bibliotecas à tipagem global da janela
declare global {
  interface Window {
    twttr?: any;
    instgrm?: any;
  }
}

const VideoEmbed = ({ url }: { url: string }) => {
  const twitterRef = useRef<HTMLDivElement>(null);
  let isTwitter = false;
  let isInstagram = false;
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
  // Lógica para Instagram
  } else if (url.includes('instagram.com')) {
    isInstagram = true;
  }

  useEffect(() => {
    // Lógica para Twitter
    if (isTwitter) {
      const renderTweet = () => {
        if (window.twttr && window.twttr.widgets && twitterRef.current) {
          twitterRef.current.innerHTML = '';
          const tweetId = url.split('/').pop()?.split('?')[0];
          if (tweetId) {
            window.twttr.widgets.createTweet(tweetId, twitterRef.current, {
              theme: 'light',
              align: 'center',
              conversation: 'none',
            });
          }
        }
      };

      if (!window.twttr) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = renderTweet;
        document.body.appendChild(script);
      } else {
        renderTweet();
      }
    }

    // Lógica para Instagram
    if (isInstagram) {
      const renderInstagram = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };

      if (!window.instgrm) {
        const script = document.createElement('script');
        script.src = '//www.instagram.com/embed.js';
        script.async = true;
        script.onload = renderInstagram;
        document.body.appendChild(script);
      } else {
        renderInstagram();
      }
    }
  }, [isTwitter, isInstagram, url]);

  // Renderiza o iframe para o YouTube
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

  // Renderiza o container para o Tweet
  if (isTwitter) {
    return (
      <div 
        ref={twitterRef} 
        className="flex justify-center mb-10 [&>iframe]:rounded-2xl [&>iframe]:shadow-lg"
      >
        {/* O widget do Twitter será renderizado aqui */}
      </div>
    );
  }

  // Renderiza o container para o Instagram
  if (isInstagram) {
    return (
      <div className="flex justify-center mb-10">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{
            background: '#FFF',
            border: '0',
            borderRadius: '12px',
            boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
            margin: '1px auto',
            maxWidth: '540px',
            minWidth: '326px',
            padding: '0',
            width: 'calc(100% - 2px)'
          }}
        >
        </blockquote>
      </div>
    );
  }

  return null;
};

export default VideoEmbed;