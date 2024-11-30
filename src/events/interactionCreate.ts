import { Bot } from "../../bot.ts";
import { InteractionTypes, InteractionResponseTypes } from "../../deps.ts";
import log from "../utils/logger.ts";
import { getDbClient } from "../database/mod.ts"; // Import the database client

Bot.events.interactionCreate = async (_, interaction) => {
  if (!interaction.data) return;

  switch (interaction.type) {
    case InteractionTypes.ApplicationCommand:
      log.info(
        `[Application Command] ${interaction.data.name} command executed.`,
      );
      Bot.commands.get(interaction.data.name!)?.execute(Bot, interaction);
      break;

    case InteractionTypes.MessageComponent:
      // Handle interactions from components (like select menus or buttons)
      if (interaction.data.customId === "mark_goal_completed") {
        const selectedGoalId = interaction.data.values![0]; // The selected goal ID from the dropdown

        try {
          // Update the goal's status to 'Completed'
          const dbClient = await getDbClient();
          await dbClient.queryObject(
            `UPDATE goal SET status = 'Completed' WHERE id = $1`,
            [selectedGoalId],
          );
          dbClient.release();
          // Acknowledge the interaction and send confirmation
          await Bot.helpers.sendInteractionResponse(
            interaction.id,
            interaction.token,
            {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: `✅ Goal marked as completed! Keep up the great work!`,
              },
            },
          );

          log.info(`Goal with ID ${selectedGoalId} marked as completed.`);
        } catch (error) {
          log.error(`Error updating goal status: ${error}`);

          // Handle errors
          await Bot.helpers.sendInteractionResponse(
            interaction.id,
            interaction.token,
            {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: "❌ There was an error marking your goal as completed. Please try again later.",
              },
            },
          );
        }
      }
      break;

    default:
      console.warn(`Unhandled interaction type: ${interaction.type}`);
  }
};
