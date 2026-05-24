const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ROOT_DIR = path.resolve(__dirname, '..');

function loadLocalEnv() {
  const envPaths = [
    path.join(ROOT_DIR, '.env.local'),
    path.join(ROOT_DIR, '.env'),
  ];

  envPaths.forEach((envPath) => {
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  });
}

loadLocalEnv();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error('Request body is too large'));
      }
    });

    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function buildFallbackRecommendation(payload) {
  const analytics = payload.analytics || {};
  const weakest = analytics.weakCategories?.[0];
  const passRate = Number(analytics.passRate || 0);
  const bestScore = Number(analytics.bestScore || 0);
  const latestScore = Number(analytics.latestScore || 0);

  if (!analytics.totalAttempts) {
    return {
      summary: 'Start with one full mock test so VanLoka can build a personal learning profile from your answers.',
      focusAreas: ['Traffic Rules', 'Traffic Signals', 'Road Signs'],
      studyPlan: [
        'Complete one timed 20-question mock test.',
        'Review every wrong answer immediately after submission.',
        'Repeat a focused test from the weakest category.',
      ],
      readiness: 'Not enough attempt history yet',
      nextAction: 'Take your first mock test',
    };
  }

  return {
    summary: `Your latest score is ${latestScore}/20 and your best score is ${bestScore}/20. ${passRate >= 70 ? 'You are trending well for the learner license test.' : 'You should focus on consistent revision before booking the real test.'}`,
    focusAreas: weakest ? [weakest.category] : ['Mixed revision'],
    studyPlan: [
      weakest ? `Revise ${weakest.category} first because it has the highest wrong-answer count.` : 'Revise all categories once before the next attempt.',
      'Spend 10 minutes reviewing explanations from your last attempt.',
      'Retake a mock test and aim for at least 12 correct answers without rushing.',
    ],
    readiness: passRate >= 70 && bestScore >= 12 ? 'Practice-ready, close to real-test readiness' : 'Needs more focused practice',
    nextAction: weakest ? `Practice ${weakest.category}` : 'Start a fresh mock test',
  };
}

function normalizeRecommendation(text, fallback) {
  if (!text) return fallback;

  const cleaned = text.trim().replace(/^```json\s*|```$/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || fallback.summary,
      focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas.slice(0, 4) : fallback.focusAreas,
      studyPlan: Array.isArray(parsed.studyPlan) ? parsed.studyPlan.slice(0, 5) : fallback.studyPlan,
      readiness: parsed.readiness || fallback.readiness,
      nextAction: parsed.nextAction || fallback.nextAction,
    };
  } catch (error) {
    return {
      ...fallback,
      summary: cleaned,
    };
  }
}

function buildDashboardPrompt(payload) {
  const analytics = payload.analytics || {};
  const trainee = payload.trainee || {};
  const recentAttempts = (payload.recentAttempts || []).slice(-5);

  return `
You are VanLoka AI, a friendly driving instructor for a Karnataka RTO learner license mock test platform.

Create a personalized learning recommendation for the trainee using this dashboard data.

Trainee:
${JSON.stringify(trainee, null, 2)}

Analytics:
${JSON.stringify(analytics, null, 2)}

Recent attempts:
${JSON.stringify(recentAttempts, null, 2)}

Return only valid JSON with this exact shape:
{
  "summary": "2 short sentences with score trend and coaching tone",
  "focusAreas": ["area 1", "area 2", "area 3"],
  "studyPlan": ["step 1", "step 2", "step 3", "step 4"],
  "readiness": "short readiness label",
  "nextAction": "single best next action"
}

Rules:
- Keep language simple for driving school trainees.
- Be specific about weak categories if present.
- Do not include markdown.
- Do not invent official exam guarantees.
`.trim();
}

function buildPerformanceFallback(payload) {
  const score = Number(payload.score || 0);
  const total = Number(payload.total || 20);
  const wrongAnswers = payload.wrongAnswers || [];
  const categoryCounts = wrongAnswers.reduce((counts, answer) => {
    const category = answer.category || 'General RTO Knowledge';
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const weakest = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const passed = score >= 12;

  if (passed) {
    return `You scored ${score}/${total} and passed the mock test. ${weakest ? `Review ${weakest} once more because it had the most mistakes.` : 'Your answers look strong across the test.'} Keep practicing timed attempts so you stay confident. You are moving in the right direction for the real learner license test.`;
  }

  return `You scored ${score}/${total}, so this attempt needs more practice. ${weakest ? `${weakest} is your main revision area right now.` : 'Review the incorrect answers carefully before retaking.'} Spend a short focused session on your weak topics. Try another mock test after revision and aim for at least 12 correct answers.`;
}

function buildPerformancePrompt(payload) {
  return `
You are a driving instructor assistant for VanLoka, a Karnataka RTO learner license training platform.

A trainee completed a mock test. Here are their results:
${JSON.stringify(payload, null, 2)}

Write a personalized performance report.

Rules:
- Write exactly 4 sentences.
- Sentence 1: Acknowledge their score warmly and say if they passed or failed.
- Sentence 2: Point out their weakest category specifically if available.
- Sentence 3: Give one specific, actionable study tip.
- Sentence 4: Motivate them to keep practicing or book the real test if they passed.
- Use simple, friendly language.
- Return plain text only.
`.trim();
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key;
  if (!apiKey) {
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 700,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || null;
}

async function handlePerformanceReport(request, response) {
  const payload = await readJsonBody(request);
  const fallback = buildPerformanceFallback(payload);

  try {
    const text = await callGemini(buildPerformancePrompt(payload));
    sendJson(response, 200, {
      report: text?.trim() || fallback,
      source: text ? 'gemini' : 'fallback',
      model: text ? GEMINI_MODEL : null,
    });
  } catch (error) {
    console.error(error);
    sendJson(response, 200, {
      report: fallback,
      source: 'fallback',
      error: 'AI performance report service is unavailable',
    });
  }
}

async function handleDashboardRecommendations(request, response) {
  const payload = await readJsonBody(request);
  const fallback = buildFallbackRecommendation(payload);

  try {
    const prompt = buildDashboardPrompt(payload);
    const text = await callGemini(prompt);
    const recommendation = normalizeRecommendation(text, fallback);
    sendJson(response, 200, {
      recommendation,
      source: text ? 'gemini' : 'fallback',
      model: text ? GEMINI_MODEL : null,
    });
  } catch (error) {
    console.error(error);
    sendJson(response, 200, {
      recommendation: fallback,
      source: 'fallback',
      error: 'AI recommendation service is unavailable',
    });
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  try {
    if (request.method === 'GET' && request.url === '/api/health') {
      sendJson(response, 200, {
        status: 'ok',
        aiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.gemini_api_key),
        model: GEMINI_MODEL,
      });
      return;
    }

    if (request.method === 'POST' && request.url === '/api/ai/dashboard-recommendations') {
      await handleDashboardRecommendations(request, response);
      return;
    }

    if (request.method === 'POST' && request.url === '/api/ai/performance-report') {
      await handlePerformanceReport(request, response);
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    sendJson(response, 400, { error: 'Invalid request' });
  }
});

server.listen(PORT, () => {
  console.log(`VanLoka API server running on http://localhost:${PORT}`);
});
