import { getLocalRecommendation } from './dashboardAnalytics';

export async function fetchDashboardRecommendation({ analytics, trainee }) {
  const fallback = getLocalRecommendation(analytics);

  try {
    const response = await fetch('/api/ai/dashboard-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analytics: {
          totalAttempts: analytics.totalAttempts,
          latestScore: analytics.latestScore,
          bestScore: analytics.bestScore,
          averageScore: analytics.averageScore,
          passRate: analytics.passRate,
          averageTime: analytics.averageTime,
          weakCategories: analytics.weakCategories,
          categoryPerformance: analytics.categoryPerformance,
          passMark: analytics.passMark,
          testTotal: analytics.testTotal,
        },
        recentAttempts: analytics.recentAttempts,
        trainee,
      }),
    });

    if (!response.ok) {
      throw new Error('Dashboard AI request failed');
    }

    const data = await response.json();
    return {
      recommendation: data.recommendation || fallback,
      source: data.source || 'fallback',
      error: data.error || '',
    };
  } catch (error) {
    console.log('Dashboard AI recommendation failed:', error);
    return {
      recommendation: fallback,
      source: 'local',
      error: 'Using local recommendation while the AI server is unavailable.',
    };
  }
}
