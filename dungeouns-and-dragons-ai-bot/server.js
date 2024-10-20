require("dotenv").config(); // Load environment variables
const express = require("express");
const bodyParser = require("body-parser");
const { startGameSession, generateImageResponse } = require("./gameSession");
const {
  LANGUAGES,
  GENRES,
  MAX_TURNS,
  gameInstructions,
  extractOptionsFromAIResponse,
} = require("./utils");

const app = express();
const PORT = process.env.PORT || 3000;

// Store game settings for active sessions
let gameSettings = {};

// Serve static files from the "public" directory (your frontend)
app.use(express.static("public"));

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// Route to serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/web_index.html");
});

// POST route to start a new game session
app.post("/start", async (req, res) => {
  const { gptVersion, language, genre, turns } = req.body;

  // Initialize game settings
  gameSettings = { gptVersion, language, genre, turns, round: 1, isGameStarted: true };

  // Start the game and get the initial response
  const response = await startGameSession(gameSettings, "", true);
  console.log(response)
  const choices = extractOptionsFromAIResponse(response);

  res.json({ message: response, choices });
});

// POST route to continue the game with user input
app.post("/continue", async (req, res) => {
  const { userPrompt } = req.body;

  if (!gameSettings.isGameStarted) {
    return res.json({ message: "No active game session. Start a new game!" });
  }

  // Increment the round and check if the game should end
  gameSettings.round++;
  if (gameSettings.round > +gameSettings.turns) {
    gameSettings.isGameStarted = false;
    return res.json({ message: "Game finished. Start a new game?" });
  }

  // Continue the game session with the user's input
  const response = await startGameSession(gameSettings, userPrompt);
  const choices = extractOptionsFromAIResponse(response);

  // Generate an image related to the game response
  const imageResponse = await generateImageResponse(response);

  res.json({ message: response, choices, imageUrl: imageResponse.data[0].url });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
