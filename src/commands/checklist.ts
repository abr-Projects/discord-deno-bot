import { ApplicationCommandTypes, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";
import { getDbClient } from "../database/mod.ts"; // Ensure this exports the connected database client

createCommand({
  name: "checklist",
  description: "View your goals checklist",
  type: ApplicationCommandTypes.ChatInput,
  execute: async (Bot, interaction) => {
    const userTag = interaction.user.username;

    try {
      // Fetch the user's goals from the database
      const dbClient = await getDbClient();
      const goalsResult = await dbClient.queryObject<{
        id: number;
        goal: string;
        date: string;
        status: string;
      }>(
        `SELECT id, goal, date, status FROM goal WHERE user_id = $1 ORDER BY date DESC`,
        [userTag],
      );
      dbClient.release();

      if (goalsResult.rows.length === 0) {
        // If no goals are found
        await Bot.helpers.sendInteractionResponse(
          interaction.id,
          interaction.token,
          {
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: {
              content: "You don't have any goals set yet. Use `/goal` to set one!",
            },
          },
        );
        return;
      }

      // Build the response message
      const goalsList = goalsResult.rows
        .map(
          (goal, index) =>
            `**${index + 1}.** ${goal.goal} (Status: ${goal.status}) - Set on ${new Date(goal.date).toLocaleDateString()}`,
        )
        .join("\n");

      const responseMessage = `📋 **Your Goals Checklist:**\n${goalsList}`;

      // Send the response
      await Bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: responseMessage,
          },
        },
      );
    } catch (error) {
      console.error("Error fetching goals:", error);

      // Handle errors
      await Bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "❌ There was an error fetching your checklist. Please try again later.",
          },
        },
      );
    }
  },
});
