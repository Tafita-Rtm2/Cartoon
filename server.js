const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Store conversations in memory
const conversations = new Map();
const geminiConversations = new Map();

// Puter Token (Optional, for /api/gemini)
const PUTER_TOKEN = process.env.PUTER_TOKEN || "";

// Models
const gptModels = ["gpt-5", "gpt-5(Azure)"];
const geminiModels = ["gemini3-flash"];

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────

async function handleGemini(req, res) {
    const { query, uid, model, roleplay, system } = req.query;
    const systemPrompt = roleplay || system;

    if (!query || !uid) {
        return res.status(400).json({
            status: false,
            error: "Please provide 'query' and 'uid'.",
            available_models: { gpt: gptModels, gemini: geminiModels }
        });
    }

    const modelToUse = (model === 'gemini3-flash') ? 'gemini-3-flash-preview' : (model || 'gemini-3-flash-preview');

    try {
        let messages = geminiConversations.get(uid) || [];
        if (systemPrompt) {
            const systemIndex = messages.findIndex(m => m.role === 'system');
            if (systemIndex !== -1) messages[systemIndex].content = systemPrompt;
            else messages.unshift({ role: 'system', content: systemPrompt });
        }

        messages.push({ role: 'user', content: query });

        const response = await axios.post('https://api.puter.com/drivers/call', {
            interface: 'puter-chat-completion',
            driver: 'ai-chat',
            method: 'complete',
            args: {
                messages: messages,
                model: modelToUse
            },
            auth_token: PUTER_TOKEN
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://puter.work',
                'Referer': 'https://puter.work/',
                'User-Agent': 'puter-js/1.0'
            },
            timeout: 30000
        });

        if (response.data && response.data.result && response.data.result.message) {
            const content = response.data.result.message.content;
            messages.push({ role: 'assistant', content: content });
            geminiConversations.set(uid, messages);

            return res.json({
                status: true,
                maintainer: "rz (jimmxzz)",
                response: content,
                result: content,
                model_type: "gemini",
                model_used: modelToUse,
                available_models: { gpt: gptModels, gemini: geminiModels }
            });
        } else {
            throw new Error("Puter AI response invalid: " + JSON.stringify(response.data));
        }
    } catch (error) {
        console.error("Gemini Puter error:", error.response ? error.response.data : error.message);
        res.status(500).json({
            status: false,
            error: "Gemini failed: " + (error.response?.data?.message || error.message)
        });
    }
}

app.get('/api/gemini', handleGemini);

app.get('/api/openai', async (req, res) => {
    const { query, uid, model, roleplay, system, imgurl } = req.query;
    const systemPrompt = roleplay || system;

    if (!query || !uid || !model) {
        return res.status(400).json({
            status: false,
            error: "Please provide 'query', 'uid', and 'model'.",
            available_models: { gpt: gptModels, gemini: geminiModels }
        });
    }

    const modelLower = model.toLowerCase();
    if (geminiModels.includes(modelLower) || modelLower.includes('gemini')) {
        return handleGemini(req, res);
    }

    try {
        let messages = conversations.get(uid) || [];
        if (systemPrompt) {
            const systemIndex = messages.findIndex(m => m.role === 'system');
            if (systemIndex !== -1) messages[systemIndex].content = systemPrompt;
            else messages.unshift({ role: 'system', content: systemPrompt });
        }

        const userMessage = { role: 'user', content: query };
        if (imgurl) {
            userMessage.content = [
                { type: 'text', text: query },
                { type: 'image_url', image_url: { url: imgurl } }
            ];
        }
        messages.push(userMessage);

        const response = await axios.post('https://gpt.tiptopuni.com/api/openai/v1/chat/completions',
            { model, messages, stream: true, temperature: 0.5 },
            {
                headers: { "Content-Type": "application/json", "Referer": "https://gpt.tiptopuni.com/" },
                responseType: 'stream'
            }
        );

        let fullResponse = '';
        let buffer = '';
        response.data.on('data', chunk => {
            buffer += chunk.toString();
            let lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                const data = trimmedLine.slice(6);
                if (data === '[DONE]') return;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content;
                    if (content) fullResponse += content;
                } catch (e) {
                    console.error("Error parsing GPT JSON:", e.message, "Line:", trimmedLine);
                }
            }
        });

        response.data.on('end', () => {
            // Fix formatting issues like "le4 février"
            const cleanedResponse = fullResponse.replace(/\ble(\d+)/gi, 'le $1');

            messages.push({ role: 'assistant', content: cleanedResponse });
            conversations.set(uid, messages);
            res.json({
                status: true,
                maintainer: "rz (jimmxzz)",
                response: cleanedResponse,
                result: cleanedResponse,
                model_type: "gpt",
                available_models: { gpt: gptModels, gemini: geminiModels }
            });
        });

        response.data.on('error', (err) => {
            console.error("GPT Stream error:", err.message);
            if (!res.headersSent) res.status(500).json({ status: false, error: "Stream error" });
        });
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ status: false, error: error.message });
    }
});

app.listen(port, () => console.log(`🚀 Server is running on port ${port}`));
