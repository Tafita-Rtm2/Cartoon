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

// Models
const gptModels = ["gpt-5", "gpt-5(Azure)"];
const geminiModels = ["pro", "rapide", "raisonement", "3 pro", "flash"];

// Gemini Cookies (provided by user, can be overridden by env)
const DEFAULT_COOKIES = [
    {"name": "SAPISID", "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "__Secure-3PAPISID", "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "_gcl_au", "value": "1.1.219111874.1769454158"},
    {"name": "AEC", "value": "AaJma5vqiVU2onYyz5ssWpGcbxNCIK1KOK1Yui8emmTkNoaJgFO1q0AIlyc"},
    {"name": "_ga_WC57KJ50ZZ", "value": "GS2.1.s1769831526$o2$g0$t1769831535$j51$l0$h0"},
    {"name": "NID", "value": "528=WamHUpHd4nN1qKPESrmJYGWf9M3AJdwRqbL-PTY1QEDHR1utnkQG_rAq98KV53OM66WpLtRfWEe0hqNxNSJ_53YdXADrynDZU61HAWxdLFwYilzH_zRs4g0fDY4PQ77gPwJtx3R7dRYNlr9cSTpWU55rHKYZhlFc6F7IQc3QjZIVtRxgr8GTl8xQ1XYWZCf4NSP96ggHNawf5qmu7SpxNoabEbz2GhnXpqhUMK5xCy0xOxMh-YgoxXNRxuaARJ5QBCxaxCPs6iHnszLGhEayGZNJcEOaTZrdaalKR6qCrqP9kcxPorGH46BsxVqbe8ncVsuE5SLE2mH0l9GCHuhSILBV8_91iMJUsTGkbdLMrV7QmtcF6NJEkq9YgqdcoIYGAGG7vDOkRV6gxIR795Fd2n0WN-WOUW6wtu8ks9ruc2cxSIsXLpfosP-Rc5dlZDDA6uQkL0OPSEvbYf4WnfvX55p4iH-IsQDB1uo25s6Czge9gLbtQXy9PCJ32hFqM95ZWrIqumCmzN4eHzOwCbTlYYhe1ecro2ach6nBG00mYCoaYj8iey0njILe0By1WEjvX7JPUGOuLtKXQZ2QHJ5oFc9V2Wc3XSZKT01SbeI_ZoIECLtDNUCpsvvqj3g9XqL8N8sRkLOG2u4Nwubb4yQ3r1W2k2Z7Bhrf4O-RSljO8z_dSNTy0Eb29zq3fSfnM7vdOOptlyD3qHI472nW-6pl3bG_-8-K6VLD7hAAefXeT3SeUQ"},
    {"name": "APISID", "value": "_654tlSVvpyHeE18/ArcQGnCoZ42AV9AE6"},
    {"name": "COMPASS", "value": "gemini-pd=CjwACWuJV93jFYb_b6k1ZbZc5AVi75OXfwVJx6huPFdJgLZgT-iphNSBtyIyTho-2Gurv4U86El7hPmdVFUQ6Jv7ywYaXQAJa4lXgICPRxTCq4WUfmrdWMST4kGs1GRj2AOMTWxzvxGleIpkW4NjMsxRVlRb-TWlRXTaFxWOpfa_RUOOJQM7L12N_u8TbQU5QCMsf3Ue0syU-exWd48W_xCqBCABMAE"},
    {"name": "__Secure-1PAPISID", "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "__Secure-3PSID", "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bW8Te9gY6q1wp9Rw5-xcqigACgYKAS4SARUSFQHGX2MiYLg-Q9E1v5qoNvH4Z1oVWhoVAUF8yKp7PeVdZO2Il0BrOMuRIUDw0076"},
    {"name": "__Secure-1PSID", "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bi1Q34Ox6-M9eWTQokjCvdAACgYKASkSARUSFQHGX2MiGVMhk66jaP5z2lbLDGoLnBoVAUF8yKqqX6whDGiYzScdHB-GgCF50076"},
    {"name": "__Secure-1PSIDCC", "value": "AKEyXzU6XJ_R0aVMjWbEmuf7PwDM4hi_KtWbWh7nef4hHddKjSWYoGOlj4StV5JO8FgEnVQlJg"},
    {"name": "__Secure-3PSIDCC", "value": "AKEyXzWbQP1DqImZSfGnqISu7vyCLVKh4A-UpqriAJ8ZlEpWyLMCUY4xyBTyeaxbv0lKBsJS_g"},
    {"name": "__Secure-BUCKET", "value": "CEI"},
    {"name": "_ga", "value": "GA1.1.221275717.1769454160"},
    {"name": "_ga_BF8Q35BMLM", "value": "GS2.1.s1769831527$o2$g0$t1769831534$j53$l0$h0"},
    {"name": "HSID", "value": "A-5Vch2LzEVcONvuJ"},
    {"name": "SEARCH_SAMESITE", "value": "CgQI_58B"},
    {"name": "SID", "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bnZkd3Ua4g6vhEZUUjOKupAACgYKAXISARUSFQHGX2MiishkltPPnlcpDZL3ozXgnxoVAUF8yKrCq-JECfM5ySHUAFHJFZs20076"},
    {"name": "SIDCC", "value": "AKEyXzVSFEMK4fjmn51qGvHdq1TX_7LNeiJeurv_2i08BUAOit9YJIdRIiKkegeTSJ1a3Q7H"},
    {"name": "SSID", "value": "AwEZUJ7YUUKjE72a1"}
];

const GEMINI_COOKIE_STR = process.env.GEMINI_COOKIES || DEFAULT_COOKIES.map(c => `${c.name}=${c.value}`).join('; ');

async function getGeminiSession() {
    try {
        const response = await axios.get('https://gemini.google.com/app', {
            headers: { 'Cookie': GEMINI_COOKIE_STR }
        });
        const snMatch = response.data.match(/"SNlM0e":"([^"]+)"/);
        const blMatch = response.data.match(/"bl":"([^"]+)"/);
        return {
            atToken: snMatch ? snMatch[1] : null,
            buildLabel: blMatch ? blMatch[1] : "boq_assistant-bard-web-server_20240201.09_p0"
        };
    } catch (e) {
        console.error("Failed to get Gemini session:", e.message);
        return null;
    }
}

async function askGemini(query, uid, modelName, systemPrompt) {
    const session = await getGeminiSession();
    if (!session || !session.atToken) throw new Error("Could not initialize Gemini session.");

    let state = geminiConversations.get(uid) || { conversationId: "", responseId: "", choiceId: "" };
    const reqId = Math.floor(Math.random() * 900000) + 100000;

    // Inject system prompt for Gemini
    let refinedQuery = query;
    if (systemPrompt) {
        refinedQuery = `[System Instruction: ${systemPrompt}]\n\n${query}`;
    }

    // Mapping based on screenshot: Rapide, Raisonnement, Pro
    if (modelName === "rapide" || modelName === "flash") refinedQuery = `(Mode: Rapide) ${refinedQuery}`;
    else if (modelName === "raisonement") refinedQuery = `(Mode: Raisonnement) ${refinedQuery}`;
    else if (modelName === "pro" || modelName === "3 pro") refinedQuery = `(Mode: Pro) ${refinedQuery}`;

    const fReq = [
        null,
        JSON.stringify([
            [refinedQuery, 0, null, null, null, null, []],
            ["en"],
            [state.conversationId, state.responseId, state.choiceId, null, null, []],
            null, null, null, [1], 0, [], [], 1, 0
        ])
    ];

    // Try multiple endpoints if one fails
    const endpoints = [
        `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/GetAnswer?bl=${session.buildLabel}&_reqid=${reqId}&rt=c`,
        `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/GetAnswer?_reqid=${reqId}&rt=c`
    ];

    let response;
    let lastError;

    for (const url of endpoints) {
        try {
            response = await axios.post(
                url,
                `f.req=${encodeURIComponent(JSON.stringify(fReq))}&at=${session.atToken}`,
                {
                    headers: {
                        'Cookie': GEMINI_COOKIE_STR,
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                        'Referer': 'https://gemini.google.com/app',
                    }
                }
            );
            if (response.status === 200) break;
        } catch (e) {
            lastError = e;
            if (e.response && e.response.status === 404) continue;
            throw e;
        }
    }

    if (!response || response.status !== 200) throw lastError || new Error("Failed to connect to Gemini API");

    const lines = response.data.split('\n');
    let responseText = "";
    for (const line of lines) {
        if (line.includes("w_f.v")) {
            try {
                const data = JSON.parse(JSON.parse(line.split(',')[2])[0][2]);
                responseText = data[4][0][1][0];
                state.conversationId = data[1][0];
                state.responseId = data[1][1];
                state.choiceId = data[4][0][0];
                geminiConversations.set(uid, state);
                break;
            } catch (e) {}
        }
    }

    if (!responseText) {
        const match = response.data.match(/\["([^"]+)",0,null,null,null,null,\[\]\]/);
        if (match) responseText = match[1];
    }

    if (!responseText) throw new Error("Empty response from Gemini.");
    return responseText;
}

// --- API Endpoints ---

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
        response.data.on('data', chunk => {
            const lines = chunk.toString().split('\n').filter(line => line.trim());
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content;
                        if (content) fullResponse += content;
                    } catch (e) {}
                }
            }
        });

        response.data.on('end', () => {
            messages.push({ role: 'assistant', content: fullResponse });
            conversations.set(uid, messages);
            res.json({
                status: true,
                maintainer: "rz (jimmxzz)",
                response: fullResponse,
                result: fullResponse,
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

async function handleGemini(req, res) {
    const { query, uid, model, roleplay, system } = req.query;
    const systemPrompt = roleplay || system;
    const modelLower = model.toLowerCase();

    const tryModels = [];
    // User requested order based on screenshot: Rapide, Raisonnement, Pro
    if (modelLower === "pro" || modelLower === "3 pro") tryModels.push("pro", "rapide", "raisonement");
    else if (modelLower === "rapide" || modelLower === "flash") tryModels.push("rapide", "pro", "raisonement");
    else if (modelLower === "raisonement") tryModels.push("raisonement", "pro", "rapide");
    else tryModels.push("pro", "rapide", "raisonement");

    let lastError = null;
    for (const m of tryModels) {
        try {
            const responseText = await askGemini(query, uid, m, systemPrompt);
            return res.json({
                status: true,
                maintainer: "rz (jimmxzz)",
                response: responseText,
                result: responseText,
                model_type: "gemini",
                model_used: m,
                available_models: { gpt: gptModels, gemini: geminiModels }
            });
        } catch (error) {
            console.error(`Gemini ${m} failed:`, error.message);
            lastError = error;
        }
    }

    res.status(500).json({ status: false, error: lastError ? lastError.message : "Gemini failed" });
}

app.listen(port, () => console.log(`Server is running on port ${port}`));
