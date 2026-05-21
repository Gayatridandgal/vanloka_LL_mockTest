const LANGUAGE_LABELS = {
  en: 'English',
  kn: 'Kannada',
  hi: 'Hindi',
};

function truncateTopic(text) {
  if (!text) return 'Not answered';
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

export async function generatePerformanceReport(score, total, timeTaken, wrongAnswers, language) {
  try {
    const percentage = Math.round((score / total) * 100);
    const passed = score >= 12;
    const minutesTaken = Math.floor(timeTaken / 60);
    const secondsRemaining = timeTaken % 60;
    const categoryCounts = wrongAnswers.reduce((counts, answer) => {
      const category = answer.category || 'General RTO Knowledge';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
    const [weakestCategory = 'No weak category', weakCategoryCount = 0] =
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || [];
    const wrongTopicsList =
      wrongAnswers
        .slice(0, 3)
        .map((answer) => truncateTopic(answer.question))
        .join(', ') || 'No wrong answers';
    const languageLabel = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;

    const prompt = `
You are a driving instructor assistant for VanLoka, a Karnataka RTO learner license training platform.

A trainee just completed a mock test. Here are their results:
- Score: ${score} out of ${total} (${percentage}%)
- Time taken: ${minutesTaken} minutes ${secondsRemaining} seconds
- Pass/Fail: ${passed ? 'PASSED' : 'FAILED'} (pass mark is 12/20)
- Weakest category: ${weakestCategory} (${weakCategoryCount} wrong answers)
- Wrong answer topics: ${wrongTopicsList}

Write a personalised performance report for this trainee in ${languageLabel}.

Rules:
- Write exactly 4 sentences
- Sentence 1: Acknowledge their score warmly and say if they passed or failed
- Sentence 2: Point out their weakest category specifically
- Sentence 3: Give one specific, actionable study tip for that weak category
- Sentence 4: Motivate them to keep practicing or book the real test if they passed
- Use simple, friendly language a driving school trainee can understand
- Do NOT use bullet points, headings, or markdown - plain paragraph only
- If language is 'kn', write entirely in Kannada script
- If language is 'hi', write entirely in Hindi
- If language is 'en', write in simple English
`.trim();

    const response = await fetch('https://api.gemini.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'geminiflash',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI report request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.content?.[0]?.text || null;
  } catch (error) {
    console.log('AI performance report failed:', error);
    return null;
  }
}
