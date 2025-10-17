from http.server import BaseHTTPRequestHandler
from basketball_reference_web_scraper import client
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query)
            days = int(query.get('days', ['7'])[0])
            
            today = datetime.now()
            year = today.year
            
            # Buscar todos os jogos da temporada
            all_games = client.season_schedule(season_end_year=year)
            
            # Filtrar próximos X dias
            future_date = today + timedelta(days=days)
            upcoming_games = []
            
            for game in all_games:
                game_date = game['start_time']
                if today.date() <= game_date.date() <= future_date.date():
                    upcoming_games.append({
                        'date': game_date.strftime('%Y-%m-%d'),
                        'time': game_date.strftime('%H:%M'),
                        'home_team': str(game['home_team']).replace('Team.', '').replace('_', ' ').title(),
                        'away_team': str(game['away_team']).replace('Team.', '').replace('_', ' ').title(),
                        'home_score': game.get('home_team_score'),
                        'away_score': game.get('away_team_score')
                    })
            
            # Ordenar por data
            upcoming_games.sort(key=lambda x: x['date'])
            
            # Resposta
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'period': f'next_{days}_days',
                'games': upcoming_games,
                'total': len(upcoming_games)
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())