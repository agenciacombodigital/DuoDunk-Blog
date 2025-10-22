"use client";

import { useEffect } from 'react';

const VideoEmbed = ({ url }: { url: string }) => {
  let embedUrl = '';
  let isTwitter = false;

  if (!url) return null;

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoIdMatch = url.match(/(?:v=|\/|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    isTwitter = true;
  }

  useEffect(() => {
    if (isTwitter) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);

      return () => {
        // Clean up the script when the component unmounts
        const scriptElement = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
        if (scriptElement) {
          document.body.removeChild(scriptElement);
        }
      };
    }
  }, [isTwitter, url]);

  if (isTwitter) {
    return (
      <div className="flex justify-center mb-10">
        <blockquote className="twitter-tweet">
          <a href={url}></a>
        </blockquote>
      </div>
    );
  }

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