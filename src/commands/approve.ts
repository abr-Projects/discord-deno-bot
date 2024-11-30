import { ApplicationCommandTypes, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";
import { getDbClient } from "../database/mod.ts";

createCommand({
  name: "approve",
  description: "Approve a goal and reward credits to the user.",
  type: ApplicationCommandTypes.ChatInput,
  execute: async (Bot, interaction) => {
    const channelId = interaction.channelId;
    const guildId = interaction.guildId;

    if (!channelId || !guildId) {
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: "This command can only be used in a server channel.",
        },
      });
      return;
    }

    try {
      // Get channel details
      const channel = await Bot.helpers.getChannel(channelId);

      // Ensure the channel name is "goal"
      if (channel.name !== "goals") {
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "This command can only be used in a channel named `goal`.",
          },
        });
        return;
      }

      // Ensure the channel is part of a category
      if (!channel.parentId) {
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "This channel is not part of a category.",
          },
        });
        return;
      }

      // Get the category details
      const category = await Bot.helpers.getChannel(channel.parentId);

      if (!category || category.type !== 4) { // Type 4 indicates a category
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "Failed to retrieve the category for this channel.",
          },
        });
        return;
      }

      const userId = category.name; // Use the category name as the user ID
      if(category.name == interaction.user.username) { // Users cant approve themselves
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "You cannot approve yourself.",
          },
        });
        return;
      }
      const creditsToAdd = 20;
      const successMessage = `✅ Approved! ${creditsToAdd} credits have been added to user "${userId}".`;

      // Fetch the last 10 messages from the channel
      const recentMessages = await Bot.helpers.getMessages(channelId, { limit: 10 });

      // Check if the success message already exists
      const isAlreadyApproved = recentMessages.some((message) => message.content === successMessage);

      if (isAlreadyApproved) {
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "This goal has already been approved, and credits have been added.",
          },
        });
        return;
      }

      // Access the database
      const dbClient = await getDbClient();

      // Check if the user exists in the credits table
      const existingUser = await dbClient.queryObject(
        `SELECT * FROM credits WHERE user_id = $1`,
        [userId],
      );

      if (existingUser.rows.length === 0) {
        // Insert a new record if the user does not exist
        await dbClient.queryObject(
          `INSERT INTO credits (user_id, amount) VALUES ($1, $2)`,
          [userId, creditsToAdd],
        );
      } else {
        // Update the user's credits if they already exist
        await dbClient.queryObject(
          `UPDATE credits SET amount = amount + $1 WHERE user_id = $2`,
          [creditsToAdd, userId],
        );
      }

      // Release the database connection
      dbClient.release();

      // Send the success message
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: successMessage,
        },
      });
    } catch (error) {
      console.error("Error processing /approve command:", error);

      // Handle errors
      await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: "❌ There was an error processing the approval. Please try again later.",
        },
      });
    }
  },
});
