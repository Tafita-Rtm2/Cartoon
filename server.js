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

// ─── COOKIES MIS À JOUR (valeurs neuves depuis votre export) ─────────────────
const userSessionCookies = [
    {"name": "SAPISID",              "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "__Secure-3PAPISID",    "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "_gcl_au",              "value": "1.1.219111874.1769454158"},
    {"name": "AEC",                  "value": "AaJma5vqiVU2onYyz5ssWpGcbxNCIK1KOK1Yui8emmTkNoaJgFO1q0AIlyc"},
    {"name": "_ga_WC57KJ50ZZ",       "value": "GS2.1.s1769843891$o6$g0$t1769843891$j60$l0$h0"},   // ← UPDATED
    {"name": "NID",                  "value": "528=JMERlyo9_TMyO1yct2-0CktoW0ZIlyX1fHW1ruhVAq9am3to6xFmEuxzWGyg2gf8pQjV8-xxr407xdym_IhpbdPZq-bs3AFj-slBJlurtXCEJ4SSlL1wVY21OQiOwwLGFMaaU4JRaGIuRcdn7j0G3hHHYa-_A7ML8_OIsMMIOci5cOuna5tGMdmZ-JoS1SoNz_ex7MqH4FTiX9YO8B80Odyfd7GwrSVViMoYMjcYBUUYBlWLuPN1aiL08txrI4mMOZi9-5nHBraNFiGg8OiNZDUYgXOjkd79j_zhwfo39pXEWglgqeA-lZTGoYVlr_vqTwkiyBd2TXbvNptlFbo6NYsldeLZAZWnNRBVM8EpDRPPPqrtENc4Zlkk0B1ULeE2nfU_F_hL_hwnIS1kORuJF9g1kOKv0eSV9Vnyl7Psp17rIuoDmcWNU9X1fl_X-ivsbQ-PRNpCmoCi5UGvnsex17tH8quBgnhrKikWE0PSiqok5sbkISpFz_wYX4xXc9glZyrtmsVhx6TALzGVKcCQIzPNAjN7rG2DZHzebqy4D9-ABrKHGJucY6WVAHnk367k29_AsDc9vGjnJnupoMiIw1fu1a0dzqiHzfveECbutSdmy2nhEweMX5iM8oVeSCk9uO1kv1N99sAkv21bWeXHeZeZHbclaiH4os7P3OunP2V8DwviAAsaxZmZt2A4nC3J1z1AuctFQVJo5qSI9CcSlzSyr0UzpmyaQvSrCMqzXWo9mQ"},
    {"name": "APISID",               "value": "_654tlSVvpyHeE18/ArcQGnCoZ42AV9AE6"},
    {"name": "COMPASS",              "value": "gemini-pd=CjwACWuJV93jFYb_b6k1ZbZc5AVi75OXfwVJx6huPFdJgLZgT-iphNSBtyIyTho-2Gurv4U86El7hPmdVFUQ6Jv7ywYaXQAJa4lXgICPRxTCq4WUfmrdWMST4kGs1GRj2AOMTWxzvxGleIpkW4NjMsxRVlRb-TWlRXTaFxWOpfa_RUOOJQM7L12N_u8TbQU5QCMsf3Ue0syU-exWd48W_xCqBCABMAE:gemini-hl=CkkACWuJV4Jq7gXnYGXm-CCWRGf1MNczIJ0yMsen8R98zb0fdd_v1HDcw_-Y0Gxw7WZu_GGVl89NUAGecp6EG6tM_DjudIlkdiK-ELT8-8sGGmoACWuJV-_RrUzSDPEusvR-T0EnkD2AO4wQb9FgDQK9KzbAw7bgw35ucYFC69DFtrIrKwXQ_1GTgtlZbPW3uWXo3yCul6JuicHLBARFlJZSy-0R71auwoG_HOokEHjEcRFVmoOzO5TfF1IkIAEwAQ"},  // ← UPDATED (ajout de gemini-hl)
    {"name": "__Secure-1PAPISID",    "value": "ekVoYAwTWVJasyry/AC_mmhY8O_i_CJ9Xf"},
    {"name": "__Secure-3PSID",       "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bW8Te9gY6q1wp9Rw5-xcqigACgYKAS4SARUSFQHGX2MiYLg-Q9E1v5qoNvH4Z1oVWhoVAUF8yKp7PeVdZO2Il0BrOMuRIUDw0076"},
    {"name": "__Secure-1PSID",       "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bi1Q34Ox6-M9eWTQokjCvdAACgYKASkSARUSFQHGX2MiGVMhk66jaP5z2lbLDGoLnBoVAUF8yKqqX6whDGiYzScdHB-GgCF50076"},
    {"name": "__Secure-1PSIDCC",     "value": "AKEyXzXrZZjC8CL29ic-kfHamtiaQJF9m8OYYlSpj3RR95E_THxNRNoog55PAB80x-pIxg-RRT4"},  // ← UPDATED
    {"name": "__Secure-3PSIDCC",     "value": "AKEyXzX_gjJmbHrG7mduyKn5tYJiYvB4Jw5SiFqTp8YX0ZPEhsKlwnysP0lERAU9Gn-LKK8b0hA"},  // ← UPDATED
    {"name": "__Secure-BUCKET",      "value": "CEI"},
    {"name": "_ga",                  "value": "GA1.1.221275717.1769454160"},
    {"name": "_ga_BF8Q35BMLM",       "value": "GS2.1.s1769843891$o5$g0$t1769843891$j60$l0$h0"},   // ← UPDATED
    {"name": "HSID",                 "value": "A-5Vch2LzEVcONvuJ"},
    {"name": "SEARCH_SAMESITE",      "value": "CgQI_58B"},
    {"name": "SID",                  "value": "g.a0006Aj8jDhx9DwPknH88r5NhjlHoHFkAgK_1f-qrbdFv6e3Xk8bnZkd3Ua4g6vhEZUUjOKupAACgYKAXISARUSFQHGX2MiishkltPPnlcpDZL3ozXgnxoVAUF8yKrCq-JECfM5ySHUAFHJFZs20076"},
    {"name": "SIDCC",                "value": "AKEyXzVBqBRiQ-9-krF0qTcIDIl5T7EkLaS6xtT7yFzFB2DRBQxDH8EmuRq-xJ4mNd_nyTNZfw"},  // ← UPDATED
    {"name": "SSID",                 "value": "AwEZUJ7YUUKjE72a1"}
];

const GEMINI_COOKIE_STR = process.env.GEMINI_COOKIES || userSessionCookies.map(c => `${c.name}=${c.value}`).join('; ');

// ─── HEADERS BROWSER (Chrome 136 pour correspondre à une version récente) ────
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://gemini.google.com',
    'Referer': 'https://gemini.google.com/app',
    'x-same-domain': '1',
    'x-goog-authuser': '0',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
};

// ─── CACHE DE SESSION (évite de re-fetcher /app à chaque requête) ────────────
let sessionCache = null;
let sessionCacheTime = 0;
const SESSION_TTL = 5 * 60 * 1000; // 5 minutes

async function getGeminiSession() {
    const now = Date.now();
    if (sessionCache && (now - sessionCacheTime) < SESSION_TTL) {
        return sessionCache;
    }

    try {
        const response = await axios.get('https://gemini.google.com/app', {
            headers: {
                'Cookie': GEMINI_COOKIE_STR,
                ...BROWSER_HEADERS,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            maxRedirects: 5,
            timeout: 15000
        });
        const html = response.data;

        // ── Extraction du atToken ──
        let atToken = null;
        const atPatterns = [
            /"SNlM0e":"([^"]+)"/,
            /"W97gF":"([^"]+)"/,
            /"at":"([^"]+)"/,
            /,"at":"([^"]{20,})"/
        ];
        for (const pattern of atPatterns) {
            const match = html.match(pattern);
            if (match) { atToken = match[1]; break; }
        }

        // ── Extraction du buildLabel ──
        let buildLabel = null;
        const blMatch = html.match(/"bl":"([^"]+)"/);
        if (blMatch) buildLabel = blMatch[1];
        // Fallback: chercher dans les script tags
        if (!buildLabel) {
            const blMatch2 = html.match(/boq_[a-z\-_]+_\d{8}\.\d+_p\d/);
            if (blMatch2) buildLabel = blMatch2[0];
        }
        if (!buildLabel) buildLabel = "boq_assistant-bard-web-server_20250101.01_p0";

        // ── Extraction du f.sid ──
        let fsid = null;
        const fsidPatterns = [/"F96u0b":"([^"]+)"/, /"f\.sid":"([^"]+)"/];
        for (const p of fsidPatterns) {
            const m = html.match(p);
            if (m) { fsid = m[1]; break; }
        }

        if (!atToken) {
            console.error("⚠️  atToken non trouvé — cookies possiblement expirés.");
            // On continue quand même, parfois le token est dans une autre page
        }

        console.log(`✅ Session récupérée | atToken: ${atToken ? atToken.substring(0,12)+'...' : 'NULL'} | bl: ${buildLabel} | fsid: ${fsid ? fsid.substring(0,12)+'...' : 'NULL'}`);

        sessionCache = { atToken, buildLabel, fsid };
        sessionCacheTime = now;
        return sessionCache;
    } catch (e) {
        console.error("❌ Erreur récupération session Gemini:", e.message);
        sessionCache = null;
        return null;
    }
}

// ─── CONSTRUCTION DU PAYLOAD CORRIGÉ ─────────────────────────────────────────
// Le problème principal : Google rejette avec af.httprm quand le format de
// f.req ne correspond plus à ce qu'il attend.
// La structure correcte pour batchexecute est :
//   f.req = [[ [rpcid, jsonPayload, null, "generic"] ]]
// ET le body doit être envoyé comme application/x-www-form-urlencoded
// avec UNIQUEMENT f.req et at (pas de paramètres supplémentaires dans le body).

function buildGeminiPayload(query, state, modelName) {
    // Identifiant de modèle dans le payload Gemini 3
    // Gemini utilise ces valeurs internes pour choisir le modèle
    let modelId = null;
    if (modelName === "rapide" || modelName === "flash") {
        modelId = "models/gemini-flash"; // Rapide = Flash
    } else if (modelName === "raisonement") {
        modelId = "models/gemini-thinking"; // Raisonnement
    } else if (modelName === "pro" || modelName === "3 pro") {
        modelId = "models/gemini-pro"; // Pro
    }

    // Structure du message utilisateur
    const userTurn = [query, 0, null, null, null, null, []];

    // État de conversation (vide pour nouvelle conversation)
    const convState = state.conversationId
        ? [state.conversationId, state.responseId, state.choiceId, null, null, []]
        : [null, null, null, null, null, []];

    // ─── PAYLOAD FORMAT ACTUEL (Gemini 3 / 2025) ───
    // Clé : l'index [7] doit contenir l'info modèle si disponible
    const payload = [
        userTurn,           // [0] message
        ["fr"],             // [1] langue (fr car votre interface est en français)
        convState,          // [2] état conversation
        null,               // [3]
        null,               // [4]
        null,               // [5]
        [1],                // [6] options de génération
        0,                  // [7]
        [],                 // [8]
        [],                 // [9]
        1,                  // [10]
        0                   // [11]
    ];

    return payload;
}

async function askGemini(query, uid, modelName, systemPrompt) {
    const session = await getGeminiSession();
    if (!session || !session.atToken) {
        throw new Error("Authentication failed — atToken introuvable. Vérifie tes cookies.");
    }

    let state = geminiConversations.get(uid) || { conversationId: null, responseId: null, choiceId: null };

    // Préparer la requête (systemprompt + query)
    let finalQuery = query;
    if (systemPrompt) {
        finalQuery = `${systemPrompt}\n\n${query}`;
    }

    const payload = buildGeminiPayload(finalQuery, state, modelName);

    // ─── LISTE DES RPCID À ESSAYER (ordre par priorité) ─────────────────────
    // "atunS3" est le rpcid actuel pour Gemini 3
    // "sh9Sbc" est un fallback plus ancien
    // "lnhpyg" est un autre rpcid utilisé par certaines versions
    const rpcids = ["atunS3", "sh9Sbc", "lnhpyg"];

    let lastError = null;

    for (const rpcid of rpcids) {
        try {
            // ── Construction du f.req EXACT ──
            // Format : [[ [rpcid, JSON.stringify(payload), null, "generic"] ]]
            const innerArray = [rpcid, JSON.stringify(payload), null, "generic"];
            const fReq = [[innerArray]];
            const fReqStr = JSON.stringify(fReq);

            // ── Body URL-encoded ──
            // IMPORTANT : encodeURIComponent sur f.req, puis &at= en clair
            const body = `f.req=${encodeURIComponent(fReqStr)}&at=${encodeURIComponent(session.atToken)}`;

            // ── URL du batchexecute ──
            // Paramètres minimaux requis : rpcids + bl
            // rt=c est obligatoire pour recevoir la réponse en "chunk" format
            let url = `https://gemini.google.com/_/BardChatUi/data/batchexecute`;
            url += `?rpcids=${rpcid}`;
            url += `&bl=${encodeURIComponent(session.buildLabel)}`;
            url += `&rt=c`;
            if (session.fsid) {
                url += `&f.sid=${encodeURIComponent(session.fsid)}`;
            }

            console.log(`🔄 Tentative avec rpcid: ${rpcid} | URL: ${url.substring(0, 100)}...`);

            const response = await axios.post(url, body, {
                headers: {
                    'Cookie': GEMINI_COOKIE_STR,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    ...BROWSER_HEADERS,
                    'Accept': '*/*',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin'
                },
                timeout: 30000,
                maxRedirects: 3,
                validateStatus: function (status) {
                    // Accepter 200 et 201, rejeter le reste
                    return status === 200 || status === 201;
                }
            });

            let data = response.data;

            // Si HTML → redirection vers login (cookies invalides)
            if (typeof data === 'string' && (data.includes('<html') || data.includes('<!DOCTYPE'))) {
                throw new Error("Google a redirigé vers la page de connexion. Tes cookies sont invalides ou expirés.");
            }

            console.log(`📥 Réponse reçue (${data.length} chars) pour rpcid: ${rpcid}`);

            // ─── PARSING DE LA RÉPONSE ───────────────────────────────────────
            // Le format de réponse de batchexecute est :
            // )]}'
            // <nombre>
            // [["wrb.fr","rpcid","<escaped JSON>",null,null,<num>,"generic"]]
            //
            // On cherche la ligne avec ["wrb.fr","<rpcid>",...] qui contient
            // le JSON de la réponse Gemini

            const responseText = parseGeminiResponse(data, rpcid);
            if (responseText) {
                // ── Sauvegarder l'état de conversation ──
                const convData = extractConversationState(data, rpcid);
                if (convData) {
                    state.conversationId = convData.conversationId;
                    state.responseId = convData.responseId;
                    state.choiceId = convData.choiceId;
                    geminiConversations.set(uid, state);
                }
                console.log(`✅ Réponse Gemini obtenue avec rpcid: ${rpcid}`);
                return responseText;
            }

            console.log(`⚠️  Réponse non parsée avec rpcid ${rpcid}, on essaie le suivant...`);
            lastError = new Error(`Parsing échoué pour rpcid ${rpcid}`);

        } catch (e) {
            lastError = e;
            console.error(`❌ rpcid ${rpcid} échoué:`, e.message);

            // Si c'est un 400 avec af.httprm, essayer le rpcid suivant
            if (e.response && e.response.status === 400) {
                console.log(`   → 400 reçu, passage au rpcid suivant...`);
                continue;
            }

            // Si c'est une erreur de login, on arrête
            if (e.message.includes("connexion") || e.message.includes("login")) {
                throw e;
            }

            // Pour les autres erreurs (timeout, network), on continue
            continue;
        }
    }

    // ─── FALLBACK : essayer avec une URL simplifiée (sans bl) ────────────────
    try {
        console.log("🔄 Tentative fallback sans buildLabel...");
        const innerArray = ["atunS3", JSON.stringify(buildGeminiPayload(finalQuery, { conversationId: null, responseId: null, choiceId: null }, modelName)), null, "generic"];
        const fReq = [[innerArray]];
        const body = `f.req=${encodeURIComponent(JSON.stringify(fReq))}&at=${encodeURIComponent(session.atToken)}`;

        const url = `https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=atunS3&rt=c`;

        const response = await axios.post(url, body, {
            headers: {
                'Cookie': GEMINI_COOKIE_STR,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                ...BROWSER_HEADERS,
                'Accept': '*/*'
            },
            timeout: 30000
        });

        const responseText = parseGeminiResponse(response.data, "atunS3");
        if (responseText) {
            console.log("✅ Réponse obtenue via fallback!");
            return responseText;
        }
    } catch (e) {
        console.error("❌ Fallback échoué:", e.message);
    }

    // ─── Erreur finale avec contexte détaillé ───────────────────────────────
    if (lastError && lastError.response) {
        geminiConversations.delete(uid);
        const snippet = String(lastError.response.data).substring(0, 300);
        throw new Error(`Gemini a rejeté la requête (${lastError.response.status}). Snippet: ${snippet}`);
    }
    throw lastError || new Error("Gemini: impossible de parser la réponse.");
}

// ─── PARSING DE LA RÉPONSE GEMINI ─────────────────────────────────────────────
function parseGeminiResponse(data, rpcid) {
    if (!data || typeof data !== 'string') return null;

    // Méthode 1 : Chercher ["wrb.fr","rpcid","<jsonEscaped>",...]
    // C'est le format standard de batchexecute
    const wrbPattern = new RegExp(`\\["wrb\\.fr","${rpcid}","((?:[^"\\\\]|\\\\.)*)"`);
    const wrbMatch = data.match(wrbPattern);
    if (wrbMatch) {
        try {
            // Le JSON est double-escapé dans la réponse
            const jsonStr = wrbMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            const parsed = JSON.parse(jsonStr);
            return extractTextFromParsed(parsed);
        } catch (e) {
            console.log("  wrb.fr parse error:", e.message);
        }
    }

    // Méthode 2 : Chercher ["w_f.v",null,"...","<jsonEscaped>"]  (ancien format)
    const wfvPattern = /\["w_f\.v",null,"[^"]*","((?:[^"\\]|\\.)*)"\]/;
    const wfvMatch = data.match(wfvPattern);
    if (wfvMatch) {
        try {
            const jsonStr = JSON.parse(`"${wfvMatch[1]}"`);
            const parsed = JSON.parse(jsonStr);
            return extractTextFromParsed(parsed);
        } catch (e) {
            console.log("  w_f.v parse error:", e.message);
        }
    }

    // Méthode 3 : Chercher directement dans les lignes (format chunk)
    const lines = data.split('\n');
    for (const line of lines) {
        if (line.includes(rpcid) && line.includes('"wrb.fr"')) {
            try {
                // Essayer de parser la ligne comme JSON array
                const arr = JSON.parse(line);
                if (Array.isArray(arr) && arr[0] === 'wrb.fr') {
                    const innerJson = JSON.parse(arr[2]);
                    return extractTextFromParsed(innerJson);
                }
            } catch (e) {}
        }
    }

    return null;
}

// ─── EXTRACTION DU TEXTE DU JSON PARSÉ ───────────────────────────────────────
function extractTextFromParsed(parsed) {
    if (!parsed || !Array.isArray(parsed)) return null;

    // Format standard Gemini : parsed[4][0][1][0] contient le texte
    try {
        if (parsed[4] && parsed[4][0] && parsed[4][0][1] && parsed[4][0][1][0]) {
            return parsed[4][0][1][0];
        }
    } catch (e) {}

    // Format alternatif : parsed[0][2] (anciens modèles)
    try {
        if (parsed[0] && parsed[0][2]) {
            return parsed[0][2];
        }
    } catch (e) {}

    // Recherche récursive du premier string long (fallback)
    try {
        const text = findFirstLongString(parsed, 10);
        if (text) return text;
    } catch (e) {}

    return null;
}

// Helper: trouver le premier string d'une certaine longueur dans un objet
function findFirstLongString(obj, minLength = 10) {
    if (typeof obj === 'string' && obj.length >= minLength) return obj;
    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findFirstLongString(item, minLength);
            if (result) return result;
        }
    }
    return null;
}

// ─── EXTRACTION DE L'ÉTAT DE CONVERSATION ───────────────────────────────────
function extractConversationState(data, rpcid) {
    // Même parsing que pour le texte, mais on extrait [1][0], [1][1], [4][0][0]
    const wrbPattern = new RegExp(`\\["wrb\\.fr","${rpcid}","((?:[^"\\\\]|\\\\.)*)"`);
    const wrbMatch = data.match(wrbPattern);
    if (wrbMatch) {
        try {
            const jsonStr = wrbMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            const parsed = JSON.parse(jsonStr);
            if (parsed[1] && parsed[4] && parsed[4][0]) {
                return {
                    conversationId: parsed[1][0] || null,
                    responseId: parsed[1][1] || null,
                    choiceId: parsed[4][0][0] || null
                };
            }
        } catch (e) {}
    }

    // Ancien format
    const wfvPattern = /\["w_f\.v",null,"[^"]*","((?:[^"\\]|\\.)*)"\]/;
    const wfvMatch = data.match(wfvPattern);
    if (wfvMatch) {
        try {
            const jsonStr = JSON.parse(`"${wfvMatch[1]}"`);
            const parsed = JSON.parse(jsonStr);
            if (parsed[1] && parsed[4] && parsed[4][0]) {
                return {
                    conversationId: parsed[1][0] || null,
                    responseId: parsed[1][1] || null,
                    choiceId: parsed[4][0][0] || null
                };
            }
        } catch (e) {}
    }

    return null;
}

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────

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

// ─── ENDPOINT DE DIAGNOSTIC ──────────────────────────────────────────────────
// Utile pour vérifier que les cookies et la session fonctionnent
app.get('/api/debug/session', async (req, res) => {
    try {
        const session = await getGeminiSession();
        res.json({
            status: true,
            session: {
                hasAtToken: !!session?.atToken,
                atTokenPreview: session?.atToken ? session.atToken.substring(0, 20) + '...' : null,
                buildLabel: session?.buildLabel,
                hasFsid: !!session?.fsid
            },
            cookieCount: userSessionCookies.length
        });
    } catch (e) {
        res.status(500).json({ status: false, error: e.message });
    }
});

app.listen(port, () => console.log(`🚀 Server is running on port ${port}`));
