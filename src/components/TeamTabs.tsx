"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Calendar, Clock, MapPin, Tv, TrendingDown, Trophy, Award } from 'lucide-react';
import TeamLogo from './TeamLogo';
import { getTeamById } from '@/lib/nbaTeams';

// Tipos simplificados para uso no Client Component
interface Player {
  id: string;
  name: string;
  fullName: string;
  position: string;
  jersey: string;
  age: string;
  height: string;
  weight: string;
  headshot: string;
  experience: number;
  college: string;
}

interface Game {
  id: string;
  date: string;
  name: string;
  shortName: string;
  homeTeam: {
    id: string;
    name: string;
    logo: any;
    score: any;
    winner: boolean;
  };
  awayTeam: {
    id: string;
    name: string;
    logo: any;
    score: any;
    winner: boolean;
  };
  status: string;
  venue?: string;
  broadcast?: string;
}

interface TeamData {
  team: {
    id: string;
    name: string;
    nickname: string;
    abbreviation: string;
    logo: string;
    color: string;
    alternateColor: string;
    location: string;
    conference: string;
    division: string;
    founded: string;
    venue: {
      name: string;
      city: string;
      capacity: number;
    };
  };
  record: {
    wins: number;
    losses: number;
    winPercent: string;
    standingSummary: string;
    gamesPlayed: number;
    streak: string;
  };
  roster: Player[];
  pastGames: Game[];
  upcomingGames: Game[];
}

interface TeamTabsProps {
  teamData: TeamData;
  teamInfo: any;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const mesesPT = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];
  
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = mesesPT[date.getMonth()];
  const hora = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  
  return `${dia} ${mes}, ${hora}:${min}`;
};

const getLogo = (logo: any, fallbackAbbr?: string): string => {
  if (typeof logo === 'string' && logo.length > 0) return logo;
  if (logo?.logos && Array.isArray(logo.logos) && logo.logos.length > 0) {
    return logo.logos[0].href || logo.logos[0].url || '';
  }
  if (logo?.href) return logo.href;
  if (logo?.url) return logo.url;
  if (fallbackAbbr) {
    return `https://a.espncdn.com/i/teamlogos/nba/500/${fallbackAbbr.toLowerCase()}.png`;
  }
  return '';
};

const extractScore = (scoreData: any): string => {
  if (typeof scoreData === 'string' || typeof scoreData === 'number') return String(scoreData);
  if (typeof scoreData === 'object' && scoreData !== null) {
    if (scoreData.displayValue) return scoreData.displayValue;
    if (scoreData.display) return scoreData.display;
    if (scoreData.value) return String(scoreData.value);
  }
  return '?';
};


export default function TeamTabs({ teamData, teamInfo }: TeamTabsProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'games'>('roster');
  const { team, roster, pastGames, upcomingGames } = teamData;

  return (
    <>
      <div className="flex gap-2 sm:gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 sm:px-6 py-3 font-bold whitespace-nowrap transition border-b-2 ${
            activeTab === 'roster'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Elenco ({roster.length})
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 sm:px-6 py-3 font-bold whitespace-nowrap transition border-b-2 ${
            activeTab === 'games'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Jogos
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'roster' && (
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            👥 Elenco 2024-25
          </h2>
          
          {roster.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {roster.map((player) => (
                <div 
                  key={player.id}
                  className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition border border-gray-200 hover:border-pink-200 group"
                >
                  <div className="flex items-start gap-4">
                    {player.headshot ? (
                      <img 
                        src={player.headshot} 
                        alt={player.name}
                        className="w-16 h-16 rounded-full object-cover bg-gray-200 flex-shrink-0 group-hover:scale-110 transition"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <Users className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {player.jersey && (
                          <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-xs font-bold flex-shrink-0">
                            #{player.jersey}
                          </span>
                        )}
                        <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                          {player.position}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 truncate">
                        {player.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        {player.height && <span>{player.height}</span>}
                        {player.weight && <span>• {player.weight}</span>}
                        {player.age && <span>• {player.age} anos</span>}
                      </div>
                      {player.college && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{player.college}</p>
                      )}
                      {player.experience > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {player.experience} {player.experience === 1 ? 'ano' : 'anos'} de NBA
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">Elenco não disponível no momento</p>
          )}
        </div>
      )}

      {activeTab === 'games' && (
        <div className="space-y-8">
          {/* Últimos Jogos */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              📊 Últimos 5 Jogos
            </h2>
            
            {pastGames.length > 0 ? (
              <div className="space-y-4">
                {pastGames.map((game) => {
                  const isHomeGame = String(game.homeTeam.id) === String(team.id);
                  
                  const teamScore = extractScore(isHomeGame ? game.homeTeam.score : game.awayTeam.score);
                  const opponentScore = extractScore(isHomeGame ? game.awayTeam.score : game.homeTeam.score);
                  
                  const opponent = isHomeGame ? game.awayTeam : game.homeTeam;
                  const won = Boolean(isHomeGame ? game.homeTeam.winner : game.awayTeam.winner);

                  return (
                    <div 
                      key={game.id}
                      className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            won 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {won ? 'V' : 'D'}
                          </div>

                          <div className="flex items-center gap-3 flex-1">
                            <img 
                              src={team.logo} 
                              alt={team.abbreviation}
                              className="w-10 h-10 object-contain"
                            />
                            <span className="font-bold text-gray-900 text-lg">
                              {teamScore}
                            </span>
                            <span className="text-gray-400">-</span>
                            <span className="font-bold text-gray-900 text-lg">
                              {opponentScore}
                            </span>
                            {/* Usando TeamLogo para o oponente */}
                            <TeamLogo
                              abbreviation={getTeamById(opponent.id)?.abbreviation || opponent.name}
                              name={opponent.name}
                              initialSrc={getLogo(opponent.logo, getTeamById(opponent.id)?.abbreviation)}
                              className="w-10 h-10 object-contain"
                            />
                            <span className="text-gray-900 font-medium hidden sm:block">
                              {opponent.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatDate(game.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">Nenhum jogo recente</p>
            )}
          </div>

          {/* Próximos Jogos */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              📅 Próximos Jogos
            </h2>
            
            {upcomingGames.length > 0 ? (
              <div className="space-y-4">
                {upcomingGames.map((game) => {
                  const isHomeGame = String(game.homeTeam.id) === String(team.id);
                  const opponent = isHomeGame ? game.awayTeam : game.homeTeam;

                  return (
                    <div 
                      key={game.id}
                      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border border-blue-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            {isHomeGame ? 'CASA' : 'FORA'}
                          </div>

                          <div className="flex items-center gap-3 flex-1">
                            <img 
                              src={team.logo} 
                              alt={team.abbreviation}
                              className="w-10 h-10 object-contain"
                            />
                            <span className="text-gray-400 font-bold text-lg">VS</span>
                            {/* Usando TeamLogo para o oponente */}
                            <TeamLogo
                              abbreviation={getTeamById(opponent.id)?.abbreviation || opponent.name}
                              name={opponent.name}
                              initialSrc={getLogo(opponent.logo, getTeamById(opponent.id)?.abbreviation)}
                              className="w-10 h-10 object-contain"
                            />
                            <span className="text-gray-900 font-medium hidden sm:block">
                              {opponent.name}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                            <Clock className="w-4 h-4" />
                            {formatDate(game.date)}
                          </div>
                          {game.broadcast && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Tv className="w-3.5 h-3.5" />
                              {game.broadcast}
                            </div>
                          )}
                          {game.venue && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin className="w-3.5 h-3.5" />
                              {game.venue}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">Nenhum jogo agendado</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}