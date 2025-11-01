from fastapi import FastAPI, Request
from pydantic import BaseModel
from nba_api.stats.endpoints import playercareerstats, commonplayerinfo
import pandas as pd

app = FastAPI()

class PlayerRequest(BaseModel):
    playerId: str

@app.post("/nba-profile")
def get_nba_profile(data: PlayerRequest):
    player_id = str(data.playerId)

    # Busca dados de perfil (nome, time, posição, etc.)
    info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
    info_dict = info.get_dict()
    row = info_dict['resultSets'][0]['rowSet'][0]
    columns = info_dict['resultSets'][0]['headers']

    # Parse infos básicas
    player_info = {col: val for col, val in zip(columns, row)}

    # Busca dados de stats de carreira
    stats = playercareerstats.PlayerCareerStats(player_id=player_id)
    df = stats.get_data_frames()[0]
    latest = df.sort_values('SEASON_ID', ascending=False).iloc[0]

    # Monta resposta compatível com frontend Dyad
    response = {
        "id": player_id,
        "name": player_info.get("DISPLAY_FIRST_LAST", ""),
        "position": player_info.get("POSITION", ""),
        "team": {
            "name": player_info.get("TEAM_NAME", ""),
            "abbreviation": player_info.get("TEAM_ABBREVIATION", ""),
            "logo": f"https://cdn.nba.com/logos/nba/{player_info.get('TEAM_ID', '')}/global/L/logo.svg"
        },
        "age": player_info.get("AGE", ""),
        "height": player_info.get("HEIGHT", ""),
        "weight": player_info.get("WEIGHT", ""),
        "birthDate": player_info.get("BIRTHDATE", ""),
        "stats": {
            "season": latest['SEASON_ID'],
            "gamesPlayed": int(latest['GP']),
            "minutes": float(latest['MIN']),
            "points": float(latest['PTS']),
            "rebounds": float(latest['REB']),
            "assists": float(latest['AST']),
            "steals": float(latest['STL']),
            "blocks": float(latest['BLK']),
            "turnovers": float(latest['TOV']),
            "fieldGoalPct": float(latest['FG_PCT']) * 100,
            "threePointPct": float(latest['FG3_PCT']) * 100,
            "freeThrowPct": float(latest['FT_PCT']) * 100,
        }
    }
    return response
