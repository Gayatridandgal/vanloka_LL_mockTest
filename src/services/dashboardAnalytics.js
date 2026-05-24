import { questions } from '../data/questions';

const PASS_MARK = 12;
const TEST_TOTAL = 20;

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.log('Unable to read dashboard history:', error);
    return [];
  }
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function formatDate(value) {
  if (!value) return 'Unknown date';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(value));
  } catch (error) {
    return 'Unknown date';
  }
}

function formatDateTime(value) {
  if (!value) return 'Unknown date';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return 'Unknown date';
  }
}

function getQuestionCategory(questionId) {
  return questions.find((question) => question.id === questionId)?.category || 'General RTO Knowledge';
}

export function readTestHistory() {
  return safeParseArray(localStorage.getItem('vanloka_test_history'));
}

export function buildDashboardAnalytics(history) {
  const attempts = Array.isArray(history) ? history : [];
  const totalAttempts = attempts.length;
  const latest = attempts.at(-1) || null;
  const scores = attempts.map((attempt) => Number(attempt.score || 0));
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const averageScore = scores.length ? round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const passedAttempts = attempts.filter((attempt) => Number(attempt.score || 0) >= PASS_MARK).length;
  const passRate = totalAttempts ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const averageTime = totalAttempts
    ? Math.round(attempts.reduce((sum, attempt) => sum + Number(attempt.timeTaken || 0), 0) / totalAttempts)
    : 0;

  const categoryMap = new Map();

  attempts.forEach((attempt) => {
    (attempt.answers || []).forEach((answer) => {
      const category = answer.category || getQuestionCategory(answer.questionId);
      const bucket = categoryMap.get(category) || {
        category,
        correct: 0,
        wrong: 0,
        total: 0,
      };

      const isCorrect = answer.selectedIndex === answer.correct;
      bucket.total += 1;
      if (isCorrect) {
        bucket.correct += 1;
      } else {
        bucket.wrong += 1;
      }
      categoryMap.set(category, bucket);
    });
  });

  const categoryPerformance = Array.from(categoryMap.values())
    .map((item) => ({
      ...item,
      accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakCategories = categoryPerformance
    .filter((item) => item.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy)
    .slice(0, 5);

  const scoreTrend = attempts.slice(-8).map((attempt, index) => ({
    label: formatDate(attempt.date) || `Test ${index + 1}`,
    score: Number(attempt.score || 0),
    total: Number(attempt.total || TEST_TOTAL),
    passed: Number(attempt.score || 0) >= PASS_MARK,
  }));

  const recentAttempts = attempts.slice(-5).reverse().map((attempt, index) => ({
    id: `${attempt.date || 'attempt'}-${index}`,
    date: formatDateTime(attempt.date),
    score: Number(attempt.score || 0),
    total: Number(attempt.total || TEST_TOTAL),
    timeTaken: Number(attempt.timeTaken || 0),
    passed: Number(attempt.score || 0) >= PASS_MARK,
    traineeName: attempt.trainee?.name || 'Trainee',
  }));

  const latestWrong = (latest?.answers || [])
    .filter((answer) => answer.selectedIndex !== answer.correct)
    .map((answer) => ({
      questionId: answer.questionId,
      category: answer.category || getQuestionCategory(answer.questionId),
    }));

  return {
    totalAttempts,
    latestScore: Number(latest?.score || 0),
    latestTotal: Number(latest?.total || TEST_TOTAL),
    bestScore,
    averageScore,
    passRate,
    passedAttempts,
    averageTime,
    categoryPerformance,
    weakCategories,
    scoreTrend,
    recentAttempts,
    latestWrong,
    passMark: PASS_MARK,
    testTotal: TEST_TOTAL,
  };
}

export function getReadinessLabel(analytics) {
  if (!analytics.totalAttempts) return 'Start baseline';
  if (analytics.bestScore >= PASS_MARK && analytics.passRate >= 70) return 'Test ready';
  if (analytics.averageScore >= 10) return 'Nearly ready';
  return 'Needs practice';
}

export function getLocalRecommendation(analytics) {
  const weakest = analytics.weakCategories[0];

  if (!analytics.totalAttempts) {
    return {
      summary: 'Take one timed mock test to unlock score trends and weak-area coaching.',
      focusAreas: ['Traffic Rules', 'Traffic Signals', 'Road Signs'],
      studyPlan: [
        'Start with a full 20-question mock test.',
        'Read every explanation after submitting.',
        'Retake the test after revising weak categories.',
      ],
      readiness: 'No attempt history yet',
      nextAction: 'Start mock test',
    };
  }

  return {
    summary: `You average ${analytics.averageScore}/20 with a best score of ${analytics.bestScore}/20. ${weakest ? `${weakest.category} needs the most attention.` : 'Your wrong answers are spread across categories.'}`,
    focusAreas: analytics.weakCategories.slice(0, 3).map((item) => item.category),
    studyPlan: [
      weakest ? `Revise ${weakest.category} signs and rules first.` : 'Revise one mixed topic set.',
      'Review wrong answers from the latest result page.',
      'Attempt another timed mock test and target 12 or more.',
    ],
    readiness: getReadinessLabel(analytics),
    nextAction: weakest ? `Practice ${weakest.category}` : 'Start a fresh test',
  };
}
