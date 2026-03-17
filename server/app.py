from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import getpass

app = Flask(__name__)
CORS(app)

USER = getpass.getuser()
DB_NAME = "nhl_dream_team"
HOST = "localhost"
PORT = "5432"

def get_db():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=USER,
        host=HOST,
        port=PORT
    )

def fetchall_dict(cur):
    columns = [desc[0] for desc in cur.description]
    return [dict(zip(columns, row)) for row in cur.fetchall()]

# Search players by name
@app.route('/players/search', methods=['GET'])
def search_players():
    query = request.args.get('q', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.playerId, p.name, p.position, p.teamName,
               s.goals, s.assists, s.points, s.games_played
        FROM Player p
        LEFT JOIN SkaterStats s ON p.playerId = s.playerId AND s.situation = 'all'
        WHERE p.name ILIKE %s
        AND p.position != 'G'
        ORDER BY p.name
    """, (f'%{query}%',))
    players = fetchall_dict(cur)
    cur.close()
    conn.close()
    return jsonify(players)

# Search goalies by name
@app.route('/goalies/search', methods=['GET'])
def search_goalies():
    query = request.args.get('q', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.playerId, p.name, p.position, p.teamName,
               g.goals_against, g.games_played, g.xgoals, g.save_pct
        FROM Player p
        LEFT JOIN GoalieStats g ON p.playerId = g.playerId AND g.situation = 'all'
        WHERE p.name ILIKE %s
        AND p.position = 'G'
        ORDER BY p.name
    """, (f'%{query}%',))
    goalies = fetchall_dict(cur)
    cur.close()
    conn.close()
    return jsonify(goalies)

# Get a single player's full stats
@app.route('/players/<int:player_id>', methods=['GET'])
def get_player(player_id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT position FROM Player WHERE playerId = %s", (player_id,))
    row = cur.fetchone()
    if not row:
        return jsonify({'error': 'Player not found'}), 404

    position = row[0]

    if position == 'G':
        cur.execute("""
            SELECT p.playerId, p.name, p.position, p.teamName,
                   g.situation, g.goals_against, g.games_played, g.xgoals, g.save_pct
            FROM Player p
            JOIN GoalieStats g ON p.playerId = g.playerId
            WHERE p.playerId = %s
        """, (player_id,))
    else:
        cur.execute("""
            SELECT p.playerId, p.name, p.position, p.teamName,
                   s.situation, s.goals, s.assists, s.points, s.games_played
            FROM Player p
            JOIN SkaterStats s ON p.playerId = s.playerId
            WHERE p.playerId = %s
        """, (player_id,))

    player = fetchall_dict(cur)
    cur.close()
    conn.close()
    return jsonify(player)

# Get all NHL teams
@app.route('/teams', methods=['GET'])
def get_teams():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT t.teamName, t.city, t.division, d.conference
        FROM Team t
        JOIN Division d ON t.division = d.division
        ORDER BY t.teamName
    """)
    teams = fetchall_dict(cur)
    cur.close()
    conn.close()
    return jsonify(teams)

# Get all players on a real NHL team
@app.route('/teams/<string:team_name>/players', methods=['GET'])
def get_team_players(team_name):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.playerId, p.name, p.position, p.teamName,
               s.goals, s.assists, s.points, s.games_played
        FROM Player p
        LEFT JOIN SkaterStats s ON p.playerId = s.playerId AND s.situation = 'all'
        WHERE p.teamName = %s
        ORDER BY p.position, p.name
    """, (team_name,))
    players = fetchall_dict(cur)
    cur.close()
    conn.close()
    return jsonify(players)

# Get aggregated stats for a real NHL team
@app.route('/teams/<string:team_name>/stats', methods=['GET'])
def get_team_stats(team_name):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            t.teamName,
            SUM(s.goals)   AS totalGoals,
            SUM(s.assists) AS totalAssists,
            SUM(s.points)  AS totalPoints,
            MAX(s.games_played)  AS games_played
        FROM Team t
        JOIN Player p ON t.teamName = p.teamName
        JOIN SkaterStats s ON p.playerId = s.playerId
        WHERE t.teamName = %s
        AND s.situation = 'all'
        GROUP BY t.teamName
    """, (team_name,))
    stats = fetchall_dict(cur)
    cur.close()
    conn.close()
    return jsonify(stats[0] if stats else {})

# Init a fresh dream team on page load
@app.route('/dreamteam/init', methods=['POST'])
def init_dream_team():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO DreamTeam (dreamTeamName)
        VALUES ('My Dream Team')
        RETURNING dreamTeamId
    """)
    dream_team_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'dreamTeamId': dream_team_id})

# Rename dream team
@app.route('/dreamteam/<int:dream_team_id>', methods=['PUT'])
def rename_dream_team(dream_team_id):
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        UPDATE DreamTeam SET dreamTeamName = %s
        WHERE dreamTeamId = %s
    """, (data['dreamTeamName'], dream_team_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Dream team renamed.'})

# Load existing NHL team as dream team template
@app.route('/dreamteam/<int:dream_team_id>/loadteam/<string:team_name>', methods=['POST'])
def load_nhl_team(dream_team_id, team_name):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        UPDATE Player SET dreamTeamId = %s
        WHERE teamName = %s
    """, (dream_team_id, team_name))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': f'Loaded {team_name} roster into dream team.'})

# Add player to dream team
@app.route('/dreamteam/<int:dream_team_id>/players/<int:player_id>', methods=['POST'])
def add_player(dream_team_id, player_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        UPDATE Player SET dreamTeamId = %s
        WHERE playerId = %s
    """, (dream_team_id, player_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Player added to dream team.'})

# Remove player from dream team
@app.route('/dreamteam/<int:dream_team_id>/players/<int:player_id>', methods=['DELETE'])
def remove_player(dream_team_id, player_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        UPDATE Player SET dreamTeamId = NULL
        WHERE playerId = %s AND dreamTeamId = %s
    """, (player_id, dream_team_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Player removed from dream team.'})

# Get dream team roster
@app.route('/dreamteam/<int:dream_team_id>/roster', methods=['GET'])
def get_dream_team_roster(dream_team_id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT p.playerId, p.name, p.position, p.teamName,
               s.goals, s.assists, s.points, s.games_played
        FROM Player p
        JOIN SkaterStats s ON p.playerId = s.playerId
        WHERE p.dreamTeamId = %s
        AND p.position != 'G'
        AND s.situation = 'all'
    """, (dream_team_id,))
    skaters = fetchall_dict(cur)

    cur.execute("""
        SELECT p.playerId, p.name, p.position, p.teamName,
               g.goals_against, g.games_played, g.xgoals, g.save_pct
        FROM Player p
        JOIN GoalieStats g ON p.playerId = g.playerId
        WHERE p.dreamTeamId = %s
        AND p.position = 'G'
        AND g.situation = 'all'
    """, (dream_team_id,))
    goalies = fetchall_dict(cur)

    cur.close()
    conn.close()
    return jsonify({'skaters': skaters, 'goalies': goalies})

# Get projected stats for a dream team
@app.route('/dreamteam/<int:dream_team_id>/projectedstats', methods=['GET'])
def get_projected_stats(dream_team_id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            SUM(s.goals)   AS totalGoals,
            SUM(s.assists) AS totalAssists,
            SUM(s.points)  AS totalPoints,
            SUM(s.games_played)  AS totalGamesPlayed
        FROM Player p
        JOIN SkaterStats s ON p.playerId = s.playerId
        WHERE p.dreamTeamId = %s
        AND s.situation = 'all'
    """, (dream_team_id,))
    skater_stats = fetchall_dict(cur)[0]

    cur.execute("""
        SELECT AVG(g.save_pct) AS avgSavePct
        FROM Player p
        JOIN GoalieStats g ON p.playerId = g.playerId
        WHERE p.dreamTeamId = %s
        AND g.situation = 'all'
    """, (dream_team_id,))
    goalie_stats = fetchall_dict(cur)[0]

    cur.close()
    conn.close()
    return jsonify({**skater_stats, **goalie_stats})

if __name__ == '__main__':
    app.run(debug=True, port=5000)