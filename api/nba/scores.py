from http.server import BaseHTTPRequestHandler
from basketball_reference_web_scraper import client
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Pegar parâmetro ?date=2025-10-17 (opcional)
            query = parse_qs(urlparse(self.path).query)
            date_str = query.get('date', [None])[0]
            
            if date_str:
                # Data específica
                date = datetime.strptime(date_str, '%Y-%m-%d')
            else:
                # Hoje
                date = datetime.now()
            
            # Buscar jogos do dia
            games = client.player_box_scores(
                day=date.day,
                month=date.month,
                year=date.year
            )
            
            # Agrupar por jogo
            games_dict = {}
            for stat in games:
                game_key = f"{stat['team']}_{stat['opponent']}"
                if game_key not in games_dict:
                    games_dict[game_key] = {
                        'home_team': str(stat['team']),
                        'away_team': str(stat['opponent']),
                        'location': str(stat['location']),
                        'outcome': str(stat['outcome']),
                        'date': date.strftime('%Y-%m-%d')
                    }
            
            # Converter para lista
            games_list = list(games_dict.values())
            
            # Resposta
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'date': date.strftime('%Y-%m-%d'),
                'games': games_list,
                'total': len(games_list)
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