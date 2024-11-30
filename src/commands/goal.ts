import { ApplicationCommandTypes, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";
import { getDbClient } from "../database/mod.ts"; 

createCommand({
  name: "goal",
  description: "Set a new goal",
  type: ApplicationCommandTypes.ChatInput,
  options: [
    {
      name: "text",
      description: "The goal to set",
      type: 3, // STRING type
      required: true,
    },
  ],
  execute: async (Bot, interaction) => {
    const userTag = interaction.user.username;
    const goalText = interaction.data!.options?.find(option => option.name === "text")?.value;

    if (!goalText) {
      await Bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "You must provide a goal to set.",
          },
        },
      );
      return;
    }

    try {
      // Insert the goal into the database
      const currentDate = new Date();

      const dbClient = await getDbClient();
      await dbClient.queryObject(`
        INSERT INTO goal (user_id, goal, date)
        VALUES ($1, $2, $3)
      `, [userTag, goalText, currentDate]);
      dbClient.release();

      // Respond back to the user confirming the goal was set
      await Bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: `✅ Your goal has been set: "${goalText}".`,
          },
        },
      );
    } catch (error) {
      console.error("Error inserting goal:", error);

      // Handle errors
      await Bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "❌ There was an error setting your goal.",
          },
        },
      );
    }
  },
});
