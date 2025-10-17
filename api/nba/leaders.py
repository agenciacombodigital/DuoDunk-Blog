from http.server import BaseHTTPRequestHandler
from basketball_reference_web_scraper import client
from datetime import datetime
from urllib.parse import parse_qs, urlparse
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query)
            category = query.get('category', ['scoring'])[0]
            limit = int(query.get('limit', ['10'])[0])
            
            year = datetime.now().year
            
            # Buscar estatísticas da temporada
            stats = client.players_season_totals(season_end_year=year)
            
            # Calcular líderes baseado na categoria
            leaders = []
            
            if category == 'scoring':
                # Pontos por jogo (aproximado)
                for player in stats:
                    ppg = player.get('points', 0) / max(player.get('games_played', 1), 1)
                    leaders.append({
                        'name': player['name'],
                        'team': str(player['team']).replace('Team.', '').replace('_', ' ').title(),
                        'stat': round(ppg, 1),
                        'stat_label': 'PPG'
                    })
            
            elif category == 'rebounds':
                for player in stats:
                    rpg = player.get('total_rebounds', 0) / max(player.get('games_played', 1), 1)
                    leaders.append({
                        'name': player['name'],
                        'team': str(player['team']).replace('Team.', '').replace('_', ' ').title(),
                        'stat': round(rpg, 1),
                        'stat_label': 'RPG'
                    })
            
            elif category == 'assists':
                for player in stats:
                    apg = player.get('assists', 0) / max(player.get('games_played', 1), 1)
                    leaders.append({
                        'name': player['name'],
                        'team': str(player['team']).replace('Team.', '').replace('_', ' ').title(),
                        'stat': round(apg, 1),
                        'stat_label': 'APG'
                    })
            
            # Ordenar e limitar
            leaders.sort(key=lambda x: x['stat'], reverse=True)
            leaders = leaders[:limit]
            
            # Resposta
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'category': category,
                'season': f'{year-1}-{year}',
                'leaders': leaders
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