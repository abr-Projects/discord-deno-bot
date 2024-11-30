import { ApplicationCommandTypes, botHasChannelPermissions, getUser, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";
import { getDbClient } from "../database/mod.ts";

createCommand({
  name: "challenge",
  description: "Set a challenge goal for all users in the server.",
  type: ApplicationCommandTypes.ChatInput,
  options: [
    {
      name: "goal",
      description: "The challenge goal to set",
      type: 3, // STRING type
      required: true,
    },
  ],
  execute: async (Bot, interaction) => {
    const guildId = interaction.guildId;
    const goalText = interaction.data?.options?.find((option) => option.name === "goal")?.value;

    if (!guildId || !goalText) {
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: "This command must be used in a server, and a goal must be provided.",
        },
      });
      return;
    }

    try {
      // Acknowledge the interaction early to prevent expiration
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.DeferredChannelMessageWithSource,
      });

      // Fetch all members of the server
      const members = await Bot.helpers.getMembers(guildId, { limit: 100 });

      // Insert the challenge goal for all users in the database
      const currentDate = new Date();
      const dbClient = await getDbClient();
      
      for (const member of members.values()) {
        const user = (await getUser(Bot, member.id));
        if(user.flags == 0) continue;
        await dbClient.queryObject(`
          INSERT INTO goal (user_id, goal, date)
          VALUES ($1, $2, $3)
        `, [user.username, goalText, currentDate]);
      }

      // Release the database connection
      dbClient.release();

      // Respond back to confirm the challenge was set
      await Bot.helpers.editInteractionResponse(interaction.token, {
        content: `✅ The challenge goal "${goalText}" has been set for all users in the server.`,
      });
    } catch (error) {
      console.error("Error setting challenge goal:", error);

      // Handle errors
      await Bot.helpers.editInteractionResponse(interaction.token, {
        content: "❌ There was an error setting the challenge goal. Please try again later.",
      });
    }
  },
});
