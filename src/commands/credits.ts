import { ApplicationCommandTypes, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";
import { getDbClient } from "../database/mod.ts";

createCommand({
  name: "credits",
  description: "Check your current credit balance.",
  type: ApplicationCommandTypes.ChatInput,
  execute: async (Bot, interaction) => {
    const userId = interaction.user.username;

    try {
      // Access the database
      const dbClient = await getDbClient();

      // Query the user's credit balance
      const result = await dbClient.queryObject<{ amount: number }>(
        `SELECT amount FROM credits WHERE user_id = $1`,
        [userId],
      );

      dbClient.release();

      if (result.rows.length === 0) {
        // User does not have a record in the database
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: `❌ You do not have any credits yet.`,
          },
        });
        return;
      }

      const { amount } = result.rows[0];

      // Send the user's credit balance
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: `✅ You currently have **${amount} credits**.`,
        },
      });
    } catch (error) {
      console.error("Error retrieving credits:", error);

      // Handle errors
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: "❌ There was an error retrieving your credit balance. Please try again later.",
        },
      });
    }
  },
});
