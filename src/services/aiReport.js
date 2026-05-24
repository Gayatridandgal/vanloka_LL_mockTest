function buildFallbackReport(score, total, wrongAnswers) {
  const passed = score >= 12;
  const categoryCounts = wrongAnswers.reduce((counts, answer) => {
    const category = answer.category || 'General RTO Knowledge';
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const weakest = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (passed) {
    return `You scored ${score}/${total} and passed the mock test. ${weakest ? `Review ${weakest} once more because it had the most mistakes.` : 'Your answers look strong across the test.'} Keep practicing timed attempts so you stay confident. You are moving in the right direction for the real learner license test.`;
  }

  return `You scored ${score}/${total}, so this attempt needs more practice. ${weakest ? `${weakest} is your main revision area right now.` : 'Review the incorrect answers carefully before retaking.'} Spend a short focused session on your weak topics. Try another mock test after revision and aim for at least 12 correct answers.`;
}

export async function generatePerformanceReport(score, total, timeTaken, wrongAnswers, language) {
  try {
    const response = await fetch('/api/ai/performance-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score,
        total,
        timeTaken,
        wrongAnswers,
        language,
        passMark: 12,
      }),
    });

    if (!response.ok) {
      throw new Error('AI report request failed');
    }

    const data = await response.json();
    return data.report || buildFallbackReport(score, total, wrongAnswers);
  } catch (error) {
    console.log('AI performance report failed:', error);
    return buildFallbackReport(score, total, wrongAnswers);
  }
}
