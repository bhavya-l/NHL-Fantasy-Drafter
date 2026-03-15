import pandas as pd
import psycopg2
from DB_Setup.nhl_teams import nhl_teams, divisions

connection = psycopg2.connect(
    dbname="postgres",
    user="bhavyalamba",
    host="localhost",
    port="5432"
)

cur = connection.cursor()
if connection.status == 1: print("Connection to DB successful")

skaters = pd.read_csv("/NHL Dream Team/data/skaters.csv")
goalies = pd.read_csv("/NHL Dream Team/data/goalies.csv")

# Loading Teams and Division Tables
teams = skaters[['team']].drop_duplicates()
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

for division, conference in divisions.items():
    cur.execute("""
        INSERT INTO Division (division, conference)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """, (division, conference))

print("Divisions inserted.")

connection.commit()
cur.close()
connection.close()