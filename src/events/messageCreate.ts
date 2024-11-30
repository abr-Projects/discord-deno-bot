import { Bot } from "../../bot.ts";
import { dotEnvConfig } from "../../deps.ts";

import axiod from "axiod";

Bot.events.messageCreate = async (_,message) => {

    function splitTextIntoSections(text: string, maxLength: number = 1800): string[] {
        if (maxLength <= 0) {
            throw new Error("Maximum length must be greater than 0");
        }
    
        const sections: string[] = [];
        let start = 0;
    
        while (start < text.length) {
            let end = start + maxLength;
    
            // If the end exceeds the text length, set it to the text's length.
            if (end > text.length) {
                end = text.length;
            } else {
                // Ensure we don't split in the middle of a word.
                const lastSpaceIndex = text.lastIndexOf(" ", end);
                if (lastSpaceIndex > start) {
                    end = lastSpaceIndex;
                }
            }
    
            sections.push(text.slice(start, end).trim());
            start = end;
        }
    
        return sections;
    }
    
    const env = dotEnvConfig({ export: true });
    if(message.channelId == 1312426346680422410n && message.isBot == false){ 
        axiod.post("https://api.groq.com/openai/v1/chat/completions", 
        {
            "model": "llama3-8b-8192",
            "messages": [
              {"role":"system", "content": "You are a educational online forum respondant. You solves problems step by step."},
              {"role": "user", "content": message.content},
              
            ]
        }
        ,{
            headers: {
                "Authorization": `Bearer ${env.groq_token}`,
                "Content-Type": "application/json"
              }
             
        }).then(
            async (res) => {
                let reply = res.data.choices[0].message.content
                if(reply.length > 1800){
                    const sections = splitTextIntoSections(reply);
                    for (const section of sections) {
                        Bot.helpers.sendTextMessage(message.channelId, section);
                        //wait 1 second before sending the next section
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                Bot.helpers.sendTextMessage(message.channelId, res.data.choices[0].message.content);

            }
        )
        
    }
};

