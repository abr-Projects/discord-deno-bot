import {
    ApplicationCommandTypes,
    InteractionResponseTypes,
    MessageComponentTypes,
  } from "../../deps.ts";
  import { createCommand } from "./mod.ts";
  import { getDbClient } from "../database/mod.ts"; // Ensure this exports the connected database client
  
  createCommand({
    name: "complete",
    description: "View and mark your goals as completed",
    type: ApplicationCommandTypes.ChatInput,
    execute: async (Bot, interaction) => {
      const userTag = interaction.user.username;
  
      try {
        // Fetch the user's goals from the database
        const dbClient = await getDbClient();
        const goalsResult = await dbClient.queryObject<{
          id: number;
          goal: string;
        }>(
          `SELECT id, goal FROM goal WHERE user_id = $1 AND status != 'Completed' ORDER BY date DESC LIMIT 10`,
          [userTag],
        );
  
        if (goalsResult.rows.length === 0) {
          // If no pending goals are found
          await Bot.helpers.sendInteractionResponse(
            interaction.id,
            interaction.token,
            {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: "🎉 You don't have any pending goals! Great job!",
              },
            },
          );
          return;
        }
  
        // Create select menu options for goals
        const selectOptions = goalsResult.rows.map((goal) => ({
          label: goal.goal,
          value: goal.id.toString(),
        }));
  
        // Send the response with a dropdown menu
        await Bot.helpers.sendInteractionResponse(
          interaction.id,
          interaction.token,
          {
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: {
              content: "📋 **Select a goal to mark as completed:**",
              components: [
                {
                  type: MessageComponentTypes.ActionRow,
                  components: [
                    {
                      type: MessageComponentTypes.SelectMenu,
                      customId: "mark_goal_completed",
                      options: selectOptions,
                      placeholder: "Select a goal...",
                    },
                  ],
                },
              ],
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
  
