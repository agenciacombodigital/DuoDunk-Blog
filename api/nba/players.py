from http.server import BaseHTTPRequestHandler
from basketball_reference_web_scraper import client
from datetime import datetime
from urllib.parse import parse_qs, urlparse
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query)
            search_term = query.get('name', [''])[0]
            
            if not search_term or len(search_term) < 2:
                raise ValueError('Nome do jogador deve ter pelo menos 2 caracteres')
            
            # Buscar jogadores
            results = client.search(term=search_term)
            
            # Formatar resultados
            players = []
            for result in results[:10]:  # Limitar a 10 resultados
                players.append({
                    'name': result.get('name', ''),
                    'identifier': result.get('identifier', ''),
                    'league': str(result.get('league', '')),
                    'position': str(result.get('positions', [])[0]) if result.get('positions') else 'N/A'
                })
            
            # Resposta
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'search_term': search_term,
                'players': players,
                'total': len(players)
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