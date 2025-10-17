from http.server import BaseHTTPRequestHandler
from basketball_reference_web_scraper import client
from datetime import datetime
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            year = datetime.now().year
            standings = client.standings(season_end_year=year)
            
            # Separar por conferência
            eastern = []
            western = []
            
            for team in standings:
                team_data = {
                    'team': str(team['team']).replace('Team.', '').replace('_', ' ').title(),
                    'wins': team['wins'],
                    'losses': team['losses'],
                    'win_percentage': round(team['win_percentage'], 3),
                    'conference': str(team['conference'])
                }
                
                if 'EASTERN' in str(team['conference']):
                    eastern.append(team_data)
                else:
                    western.append(team_data)
            
            # Ordenar por vitórias
            eastern.sort(key=lambda x: x['wins'], reverse=True)
            western.sort(key=lambda x: x['wins'], reverse=True)
            
            # Resposta
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'season': f'{year-1}-{year}',
                'eastern_conference': eastern,
                'western_conference': western,
                'updated_at': datetime.now().isoformat()
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