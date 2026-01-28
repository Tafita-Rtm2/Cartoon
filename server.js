const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for your HTML/Iframe usage
app.use(cors());
app.use(express.json());

// Store conversations in memory
const conversations = new Map();

// Define models based on your code
const modelsData = [
  "gpt-5",
  "gpt-5(Azure)"
];

app.get('/api/openai', async (req, res) => {
  // Map 'roleplay' to 'system' variable
  const { query, uid, model, roleplay, imgurl } = req.query;

  // Validate required fields
  if (!query || !uid || !model) {
    return res.status(400).json({
      status: false,
      error: "Please provide 'query', 'uid', and 'model'.",
      available_models: {
        chat: modelsData
      }
    });
  }

  try {
    // Handle Conversation History
    let messages = conversations.get(uid) || [];
    
    // Add Roleplay (System message) if provided and it's the start of a chat
    // Or if you want to inject it dynamically. 
    // Logic: If roleplay exists and not already set, we add it.
    if (roleplay && messages.length === 0) {
      messages.push({ role: 'system', content: roleplay });
    }

    // Construct User Message
    const userMessage = {
      role: 'user',
      content: query
    };

    if (imgurl) {
      userMessage.content = [
        { type: 'text', text: query },
        { type: 'image_url', image_url: { url: imgurl } }
      ];
    }

    messages.push(userMessage);

    // Call the External API
    const response = await axios.post('https://gpt.tiptopuni.com/api/openai/v1/chat/completions',
      {
        model: model,
        messages: messages,
        stream: true,
        temperature: 0.5,
        presence_penalty: 0,
        frequency_penalty: 0,
        top_p: 1
      },
      {
        headers: {
          "Content-Type": "application/json",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "sec-ch-ua": "\"Chromium\";v=\"137\", \"Not/A)Brand\";v=\"24\"",
          "sec-ch-ua-arch": "\"\"",
          "sec-ch-ua-bitness": "\"\"",
          "sec-ch-ua-full-version": "\"137.0.7337.0\"",
          "sec-ch-ua-full-version-list": "\"Chromium\";v=\"137.0.7337.0\", \"Not/A)Brand\";v=\"24.0.0.0\"",
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-model": "\"SM-A057F\"",
          "sec-ch-ua-platform": "\"Android\"",
          "sec-ch-ua-platform-version": "\"15.0.0\"",
          "Referer": "https://gpt.tiptopuni.com/"
        },
        responseType: 'stream'
      }
    );

    let fullResponse = '';

    // Process the stream
    response.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
            }
          } catch (e) {
            // Ignore parsing errors for partial chunks
          }
        }
      }
    });

    // When stream ends, send the formatted JSON
    response.data.on('end', () => {
      // Save assistant response to history
      messages.push({ role: 'assistant', content: fullResponse });
      conversations.set(uid, messages);

      // Send the specific JSON format you requested
      res.json({
        status: true,
        maintainer: "rz (jimmxzz)",
        response: fullResponse,
        model_type: "chat",
        available_models: {
          chat: modelsData
        }
      });
    });

  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      status: false,
      error: error.message,
      maintainer: "rz (jimmxzz)",
      available_models: {
        chat: modelsData
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
