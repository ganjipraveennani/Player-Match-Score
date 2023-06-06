const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Get players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      player_id as playerId, player_name as playerName
    FROM
      player_details
    ORDER BY
      player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

//Get Specific Player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `
  SELECT 
    player_id as playerId, player_name as playerName 
  FROM 
    player_details 
  WHERE
    player_id = ${playerId};`;
  const specificPlayerObject = await db.get(getSpecificPlayerQuery);
  response.send(specificPlayerObject);
});

//Get Specific Match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchQuery = `
  SELECT 
    match_id as matchId, match, year 
  FROM 
    match_details 
  WHERE
    match_id = ${matchId};`;
  const specificMatchObject = await db.get(getSpecificMatchQuery);
  response.send(specificMatchObject);
});

//Update Player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name='${playerName}'
    WHERE
      player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Matches Based On PlayerId's
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesBasedOnPlayerIdQuery = `
    SELECT
      match_details.match_id as matchId, match, year
    FROM
      match_details
      INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
      INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
    WHERE
      player_match_score.player_id=${playerId};`;
  const specificMatchObject = await db.all(getMatchesBasedOnPlayerIdQuery);
  response.send(specificMatchObject);
});

//Get Players Based On MatchId's
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersBasedOnMatchIdQuery = `
    SELECT
      player_details.player_id as playerId, player_name as playerName
    FROM
      player_details
      INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
      INNER JOIN match_details ON match_details.match_id = player_match_score.match_id
    WHERE
      player_match_score.match_id=${matchId};`;
  const specificPlayerObject = await db.all(getPlayersBasedOnMatchIdQuery);
  response.send(specificPlayerObject);
});

//Stats of Specific Player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfSpecificPlayerQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes 
    FROM player_details 
    INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const specificPlayerStatsObject = await db.all(getStatsOfSpecificPlayerQuery);
  response.send(...specificPlayerStatsObject);
});

module.exports = app;
