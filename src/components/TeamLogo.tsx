"use client";

import React, { useState, useEffect } from 'react';

interface TeamLogoProps {
  abbreviation: string;
  name: string;
  initialSrc: string;
  className: string;
}

export default function TeamLogo({ abbreviation, name, initialSrc, className }: TeamLogoProps) {
  const abbr = abbreviation.toLowerCase();
  
  // Lista de URLs para tentar em ordem
  const alternatives = [
    initialSrc,
    `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${abbr}.png&h=200&w=200`,
    `https://a.espncdn.com/i/teamlogos/nba/500/${abbr === 'uta' ? 'utah' : abbr}.png`,
    `https://a.espncdn.com/i/teamlogos/nba/500/${abbr === 'nop' ? 'no' : abbr}.png`
  ];

  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  const [showFallbackText, setShowFallbackText] = useState(false);

  // Resetar o estado se a abreviação mudar
  useEffect(() => {
    setCurrentSrcIndex(0);
    setShowFallbackText(false);
  }, [abbreviation]);

  const handleError = () => {
    if (currentSrcIndex < alternatives.length - 1) {
      // Tenta a próxima alternativa
      setCurrentSrcIndex(prev => prev + 1);
    } else {
      // Se todas falharem, mostra o texto de fallback
      setShowFallbackText(true);
    }
  };

  if (showFallbackText) {
    return (
      <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg transition overflow-hidden">
        <span className="text-3xl font-black text-gray-400">{abbreviation}</span>
      </div>
    );
  }

  return (
    <img 
      src={alternatives[currentSrcIndex]}
      alt={name}
      className={className}
      onError={handleError}
    />
  );
}