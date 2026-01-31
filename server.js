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

// Gemini Session Cookies (User Provided)
const userSessionCookies = [
    {"name": "SAPISID", "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "__Secure-3PAPISID", "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "_gcl_au", "value": "1.1.219111874.1769454158"},
    {"name": "AEC", "value": "AaJma5vqiVU2onYyz5ssWpGcbxNCIK1KOK1Yui8emmTkNoaJgFO1q0AIlyc"},
    {"name": "_ga_WC57KJ50ZZ", "value": "GS2.1.s1769840704$o5$g1$t1769840720$j44$l0$h0"},
    {"name": "NID", "value": "528=JMERlyo9_TMyO1yct2-0CktoW0ZIlyX1fHW1ruhVAq9am3to6xFmEuxzWGyg2gf8pQjV8-xxr407xdym_IhpbdPZq-bs3AFj-slBJlurtXCEJ4SSlL1wVY21OQiOwwLGFMaaU4JRaGIuRcdn7j0G3hHHYa-_A7ML8_OIsMMIOci5cOuna5tGMdmZ-JoS1SoNz_ex7MqH4FTiX9YO8B80Odyfd7GwrSVViMoYMjcYBUUYBlWLuPN1aiL08txrI4mMOZi9-5nHBraNFiGg8OiNZDUYgXOjkd79j_zhwfo39pXEWglgqeA-lZTGoYVlr_vqTwkiyBd2TXbvNptlFbo6NYsldeLZAZWnNRBVM8EpDRPPPqrtENc4Zlkk0B1ULeE2nfU_F_hL_hwnIS1kORuJF9g1kOKv0eSV9Vnyl7Psp17rIuoDmcWNU9X1fl_X-ivsbQ-PRNpCmoCi5UGvnsex17tH8quBgnhrKikWE0PSiqok5sbkISpFz_wYX4xXc9glZyrtmsVhx6TALzGVKcCQIzPNAjN7rG2DZHzebqy4D9-ABrKHGJucY6WVAHnk367k29_AsDc9vGjnJnupoMiIw1fu1a0dzqiHzfveECbutSdmy2nhEweMX5iM8oVeSCk9uO1kv1N99sAkv21bWeXHeZeZHbclaiH4os7P3OunP2V8DwviAAsaxZmZt2A4nC3J1z1AuctFQVJo5qSI9CcSlzSyr0UzpmyaQvSrCMqzXWo9mQ"},
    {"name": "APISID", "value": "_654tlSVvpyHeE18/ArcQGnCoZ42AV9AE6"},
    {"name": "COMPASS", "value": "gemini-pd=CjwACWuJV93jFYb_b6k1ZbZc5AVi75OXfwVJx6huPFdJgLZgT-iphNSBtyIyTho-2Gurv4U86El7hPmdVFUQ6Jv7ywYaXQAJa4lXgICPRxTCq4WUfmrdWMST4kGs1GRj2AOMTWxzvxGleIpkW4NjMsxRVlRb-TWlRXTaFxWOpfa_RUOOJQM7L12N_u8TbQU5QCMsf3Ue0syU-exWd48W_xCqBCABMAE"},
    {"name": "__Secure-1PAPISID", "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "__Secure-3PSID", "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bW8Te9gY6q1wp9Rw5-xcqigACgYKAS4SARUSFQHGX2MiYLg-Q9E1v5qoNvH4Z1oVWhoVAUF8yKp7PeVdZO2Il0BrOMuRIUDw0076"},
    {"name": "__Secure-1PSID", "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bi1Q34Ox6-M9eWTQokjCvdAACgYKASkSARUSFQHGX2MiGVMhk66jaP5z2lbLDGoLnBoVAUF8yKqqX6whDGiYzScdHB-GgCF50076"},
    {"name": "__Secure-1PSIDCC", "value": "AKEyXzXcM9sXu_cW81Fr-hGe2FlWSZE8dueUFjgd7USb6E4QzVpIFYOzOAf5KVc7l2ayN0lYaLY"},
    {"name": "__Secure-3PSIDCC", "value": "AKEyXzWbqVVQElkNf_RcbN2xExRVZgtdiiYPQIikgP4SNTQtA6_FM62promaTHKKMTkY29lt5as"},
    {"name": "__Secure-BUCKET", "value": "CEI"},
    {"name": "_ga", "value": "GA1.1.221275717.1769454160"},
    {"name": "_ga_BF8Q35BMLM", "value": "GS2.1.s1769840706$o4$g1$t1769840720$j46$l0$h0"},
    {"name": "HSID", "value": "A-5Vch2LzEVcONvuJ"},
    {"name": "SEARCH_SAMESITE", "value": "CgQI_58B"},
    {"name": "SID", "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bnZkd3Ua4g6vhEZUUjOKupAACgYKAXISARUSFQHGX2MiishkltPPnlcpDZL3ozXgnxoVAUF8yKrCq-JECfM5ySHUAFHJFZs20076"},
    {"name": "SIDCC", "value": "AKEyXzWrn0R7MnRj43rH_F0U2yaGRhLMj5RD4uNntMSP68q214JY2oEderyyHwACsJxvXbZFNA"},
    {"name": "SSID", "value": "AwEZUJ7YUUKjE72a1"}
];

const GEMINI_COOKIE_STR = process.env.GEMINI_COOKIES || userSessionCookies.map(c => `${c.name}=${c.value}`).join('; ');

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://gemini.google.com',
    'Referer': 'https://gemini.google.com/app',
    'x-same-domain': '1',
    'x-goog-authuser': '0'
};

async function getGeminiSession() {
    try {
        const response = await axios.get('https://gemini.google.com/app', {
            headers: {
                'Cookie': GEMINI_COOKIE_STR,
                ...BROWSER_HEADERS
            }
        });
        const html = response.data;

        // Advanced token extraction logic
        let atToken = null;
        const atPatterns = [/"SNlM0e":"([^"]+)"/, /"W97gF":"([^"]+)"/, /"at":"([^"]+)"/];
        for (const pattern of atPatterns) {
            const match = html.match(pattern);
            if (match) { atToken = match[1]; break; }
        }

        const blMatch = html.match(/"bl":"([^"]+)"/);
        const fsidMatch = html.match(/"F96u0b":"([^"]+)"/) || html.match(/"f\.sid":"([^"]+)"/);

        if (!atToken) {
            console.error("Critical: atToken (SNlM0e) not found in response.");
        }

        return {
            atToken: atToken,
            buildLabel: blMatch ? blMatch[1] : "boq_assistant-bard-web-server_20240501.01_p0",
            fsid: fsidMatch ? fsidMatch[1] : null
        };
    } catch (e) {
        console.error("Failed to get Gemini session:", e.message);
        return null;
    }
}

async function askGemini(query, uid, modelName, systemPrompt) {
    const session = await getGeminiSession();
    if (!session || !session.atToken) throw new Error("Authentication failed (atToken missing). Please check your cookies.");

    let state = geminiConversations.get(uid) || { conversationId: "", responseId: "", choiceId: "" };

    let refinedQuery = query;
    if (systemPrompt) {
        refinedQuery = `[System Instructions: ${systemPrompt}]\n\n${query}`;
    }

    // Embed model selection in the query as a strategy
    if (modelName === "rapide" || modelName === "flash") refinedQuery = `(Rapide) ${refinedQuery}`;
    else if (modelName === "raisonement") refinedQuery = `(Raisonnement) ${refinedQuery}`;
    else if (modelName === "pro" || modelName === "3 pro") refinedQuery = `(Pro) ${refinedQuery}`;

    // Payload variants to try (Gemini's internal structures change)
    const payloadVariants = [
        // Variant 1: Modern Gemini 1.5 style
        [
            [refinedQuery, 0, null, null, null, null, []],
            ["en"],
            [state.conversationId || "", state.responseId || "", state.choiceId || "", null, null, []],
            null, null, null, [1], 0, [], [], 1, 0
        ],
        // Variant 2: Simplified older style
        [
            [refinedQuery, 0, null, null, null, null, []],
            ["en"],
            [state.conversationId || "", state.responseId || "", state.choiceId || ""],
            null, null, null, [1], 0, [], [], 1, 0
        ]
    ];

    const rpcids = ["atunS3", "sh9Sbc"];
    let lastError;

    const tryRequest = async (rpcid, payload, useBuildLabel = true) => {
        const fReq = [[[rpcid, JSON.stringify(payload), null, "generic"]]];
        const body = `f.req=${encodeURIComponent(JSON.stringify(fReq))}&at=${session.atToken}`;

        let url = `https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=${rpcid}&rt=c`;
        if (useBuildLabel) url += `&bl=${session.buildLabel}`;
        if (session.fsid) url += `&f.sid=${session.fsid}`;

        return await axios.post(url, body, {
            headers: {
                'Cookie': GEMINI_COOKIE_STR,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                ...BROWSER_HEADERS
            },
            timeout: 25000
        });
    };

    for (const rpcid of rpcids) {
        for (const payload of payloadVariants) {
            try {
                // Try with and without build label fallback
                let response = await tryRequest(rpcid, payload, true);
                let data = response.data;

                // If the response is HTML (login page), it's a cookie issue
                if (typeof data === 'string' && data.startsWith('<html')) {
                    throw new Error("Google redirected to a login page. Your cookies are invalid or being blocked.");
                }

                if (data.includes(rpcid)) {
                    const lines = data.split('\n');
                    for (const line of lines) {
                        const match = line.match(/\["w_f\.v",null,".*?","(.*)"\]/);
                        if (match) {
                            try {
                                const jsonStr = JSON.parse(`"${match[1]}"`);
                                const chatData = JSON.parse(jsonStr);
                                const responseText = chatData[4][0][1][0];

                                state.conversationId = chatData[1][0];
                                state.responseId = chatData[1][1];
                                state.choiceId = chatData[4][0][0];
                                geminiConversations.set(uid, state);

                                return responseText;
                            } catch (e) {}
                        }
                    }
                }
            } catch (e) {
                lastError = e;
                if (e.response && e.response.status === 400) continue;
                if (e.message.includes("Google redirected")) throw e;
                console.log(`Failed RPCID ${rpcid} with variant. Error: ${e.message}`);
            }
        }
    }

    // Final attempt: Legacy GetAnswer
    try {
        const getAnswerUrl = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/GetAnswer?bl=${session.buildLabel}&rt=c`;
        const legacyPayload = [null, JSON.stringify([[refinedQuery, 0, null, null, null, null, []], ["en"], [state.conversationId, state.responseId, state.choiceId, null, null, []], null, null, null, [1], 0, [], [], 1, 0])];
        const res = await axios.post(getAnswerUrl, `f.req=${encodeURIComponent(JSON.stringify(legacyPayload))}&at=${session.atToken}`, {
            headers: { 'Cookie': GEMINI_COOKIE_STR, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', ...BROWSER_HEADERS }
        });
        const match = res.data.match(/\["w_f\.v",null,".*?","(.*)"\]/);
        if (match) {
            const data = JSON.parse(JSON.parse(`"${match[1]}"`));
            return data[4][0][1][0];
        }
    } catch (e) {}

    if (lastError && lastError.response) {
        geminiConversations.delete(uid); // Reset state on persistent 400
        throw new Error(`Gemini Rejected with 400. This is likely due to the "af.httprm" structural rejection. Response snippet: ${String(lastError.response.data).substring(0, 150)}`);
    }
    throw lastError || new Error("Gemini response parsing failed.");
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
