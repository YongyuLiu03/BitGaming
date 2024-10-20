require("dotenv").config();
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

let assistant = null;
let thread = null;

const handleOpenAiRequest = async (threadId, assistantId) => {
  let run = await openai.beta.threads.runs.createAndPoll(threadId, {
    assistant_id: assistantId,
  });

  let result = "";

  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);

    for (const dataItem of messages.data) {
      result = dataItem.content?.[0]?.text?.value ?? "";
      console.log(result);
      console.log("_____________");
    }

    result = messages.data[0].content?.[0]?.text?.value ?? "";
  } else {
    result = "The game session has been interrupted. Please try again.";
  }

  return result;
};

const startGameSession = async (
  gameSettings,
  userPrompt,
  isFirstTurn = false
) => {
  // for multiple users add (The game will be played by {2} players, ask them questions in turns. --- optional)

  //change later to use id of already created assistant
  if (isFirstTurn) {
    assistant = await openai.beta.assistants.create({
      name: "Roleplaying game master",
      instructions: `You are the author of an interactive quest in a ${gameSettings.genre} setting. 
            Come up with an interesting story. Your message is a part of the story that forces the player(s) to make a choice.
            The game should consist of a short part (up to ${gameSettings.max_chars} characters) of your story and the options for player actions you propose.
            At the end of each of your messages, ask a question about how the player should act in the current situation. 
            Offer at minimum three options to choose from, but leave the opportunity to offer actions by player.
            The quest must be completed within ${gameSettings.turns} player(s) turns.
            The game can be played by one or several players. 
            If there is more than one player, players must take turns - if someone breaks the line, report it and ask the correct player to respond.
            Create a story depending on the number of players playing. Players will respond with the structure {"Player Name": "Response"}.
            With each turn the situation should become more intense and logically related to the previous turn.
            The player(s) may encounter various dangers on theirs journey. 
            If the player chooses a bad answer, player may die and then the game will end.
            Use a speaking style that suits the chosen setting.
            Each time you would be notified with the current turn/round number.
                Make sure to finish the story within ${gameSettings.turns} rounds.
                Don't ask the user anything after the game finishes. Just congratulate.
            Communicate with players in (${gameSettings.language} language). Each response should be in the same language - ${gameSettings.language}.
            After the end of the game (due to the death of all players or due to the fact that all turns have ended), invite the player(s) to start again (to do this, they needs to enter and send "/create")`,
      tools: [{ type: "code_interpreter" }],
      model:
        gameSettings.gptVersion === "GPT-4" ? "gpt-4-turbo" : "gpt-4o-mini",
    });
    thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "assistant",
      content: "Generating story for the game.",
    });

    const response = await handleOpenAiRequest(thread.id, assistant.id);
    return response;
  } else {
    if (!thread || !assistant) {
      return "rofl";
    }
    await openai.beta.threads.messages.create(thread.id, {
      role: "assistant",
      content: `Round ${gameSettings.round}`,
    });

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userPrompt,
    });

    const response = await handleOpenAiRequest(thread.id, assistant.id);
    return response;
  }
};

async function generateImageResponse(prompt) {
  const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });
  return response;
}

module.exports = {
  startGameSession,
  generateImageResponse,
};
