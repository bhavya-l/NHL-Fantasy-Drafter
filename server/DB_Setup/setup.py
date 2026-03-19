import psycopg2
import pandas as pd
from psycopg2 import sql
from nhl_teams import nhl_teams, divisions
import getpass

USER = getpass.getuser()
DB_NAME = "nhl_dream_team"
HOST = "localhost"
PORT = "5432"


def create_database():
    conn = psycopg2.connect(
        dbname="postgres",
        user=USER,
        host=HOST,
        port=PORT
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("DROP DATABASE IF EXISTS nhl_dream_team")
    cur.execute(f"CREATE DATABASE {DB_NAME}")
    cur.close()
    conn.close()

def create_tables(cur):
    cur.execute("""
    CREATE TABLE IF NOT EXISTS Divisions (
        division TEXT PRIMARY KEY,
        conference TEXT
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS Team (
        teamName TEXT PRIMARY KEY,
        city TEXT,
        division TEXT REFERENCES Divisions(division)
    );
    """)

    cur.execute("""
        CREATE TABLE DreamTeam (
            dreamTeamId SERIAL PRIMARY KEY,
            dreamTeamName VARCHAR(100),
            createdDate DATE DEFAULT CURRENT_DATE
        )
    """)
 
    cur.execute("""
    CREATE TABLE Player (
        playerId INT PRIMARY KEY,
        name VARCHAR(100),
        position VARCHAR(10),
        teamName VARCHAR(100) REFERENCES Team(teamName),
        dreamTeamId INT REFERENCES DreamTeam(dreamTeamId)
    )
""")
    
    cur.execute("""
    CREATE TABLE SkaterStats (
        skaterStatId SERIAL PRIMARY KEY,
        playerId INT REFERENCES Player(playerId),
        situation VARCHAR(10),
        points INT,
        assists INT,
        goals INT,
        games_played INT
    )
""")

    cur.execute("""
    CREATE TABLE GoalieStats (
        goalieStatId SERIAL PRIMARY KEY,
        playerId INT REFERENCES Player(playerId),
        situation VARCHAR(10),
        goals_against INT,
        games_played INT,
        xGoals DECIMAL(6,3),
        save_pct DECIMAL(5,4)
    )
""")
    
def connect_db():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=USER,
        host=HOST,
        port=PORT
    )

create_database()

connection = connect_db()
cur = connection.cursor()

if connection.status == 1:
    print("Connection to DB successful")

create_tables(cur)

skaters = pd.read_csv("../data/skaters.csv")
goalies = pd.read_csv("../data/goalies.csv")

teams = skaters[['team']].drop_duplicates()

for division, conference in divisions.items():
    cur.execute("""
        INSERT INTO Divisions (division, conference)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """, (division, conference))

print("Divisions inserted.")

for _, row in teams.iterrows():
    abbr = row['team']

    if abbr in nhl_teams:
        teamName, city, division, conference = nhl_teams[abbr]
    else:
        teamName, city, division = abbr, 'UNKNOWN', 'UNKNOWN'

    cur.execute("""
        INSERT INTO Team (teamName, city, division)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    """, (teamName, city, division))

print("Teams inserted.")

for _, row in skaters.iterrows():
    abbr = row['team']
    teamName = nhl_teams[abbr][0] if abbr in nhl_teams else abbr
    cur.execute("""
        INSERT INTO Player (playerId, name, position, teamName, dreamTeamId)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (playerId) DO NOTHING
    """, (
        int(row['playerId']),
        row['name'],
        row['position'],
        teamName,
        None
    ))
for _, row in goalies.iterrows():
    abbr = row['team']
    teamName = nhl_teams[abbr][0] if abbr in nhl_teams else abbr
    cur.execute("""
        INSERT INTO Player (playerId, name, position, teamName, dreamTeamId)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (playerId) DO NOTHING
    """, (
        int(row['playerId']),
        row['name'],
        row['position'],
        teamName,
        None
    ))
print("Players inserted.")

for _, row in skaters.iterrows():
    assists = 0
    if 'I_F_primaryAssists' in skaters.columns:
        assists += int(row['I_F_primaryAssists']) if pd.notna(row['I_F_primaryAssists']) else 0
    if 'I_F_secondaryAssists' in skaters.columns:
        assists += int(row['I_F_secondaryAssists']) if pd.notna(row['I_F_secondaryAssists']) else 0
    cur.execute("""
        INSERT INTO SkaterStats (playerId, games_played, situation, points, assists, goals)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        int(row['playerId']),
        int(row['games_played']) if pd.notna(row['games_played']) else 0,
        row['situation'],
        int(row['I_F_points']) if pd.notna(row['I_F_points']) else 0,
        assists,
        int(row['I_F_goals']) if pd.notna(row['I_F_goals']) else 0
    ))
print("SkaterStats inserted.")

for _, row in goalies.iterrows():
    on_goal = row['ongoal'] if pd.notna(row['ongoal']) else 0
    goals = row['goals'] if pd.notna(row['goals']) else 0
    save_pct = float((on_goal - goals) / on_goal) if on_goal > 0 else 0.0
    cur.execute("""
        INSERT INTO GoalieStats (playerId, games_played, situation, goals_against, xGoals, save_pct)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        int(row['playerId']),
        int(row['games_played']) if pd.notna(row['games_played']) else 0,
        row['situation'],
        int(row['goals']) if pd.notna(row['goals']) else 0,
        float(row['xGoals']) if pd.notna(row['xGoals']) else 0.0,
        save_pct
    ))
print("GoalieStats inserted.")

connection.commit()
cur.close()
connection.close()