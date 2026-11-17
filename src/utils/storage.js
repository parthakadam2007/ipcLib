// Utility functions for LocalStorage management

const STORAGE_KEYS = {
  PREFERENCES: 'ipc_lab_prefs',
  PROGRESS: 'ipc_lab_progress',
  QUIZ_RESULTS: 'ipc_lab_quiz',
  RECENT_SIMS: 'ipc_lab_recent',
};

export const getPreferences = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : { theme: 'dark', speed: 1, sound: false };
  } catch (e) {
    return { theme: 'dark', speed: 1, sound: false };
  }
};

export const savePreferences = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
};

export const getProgress = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : { completedScenarios: [], visitedMechanisms: ['dashboard'] };
  } catch (e) {
    return { completedScenarios: [], visitedMechanisms: ['dashboard'] };
  }
};

export const markMechanismVisited = (id) => {
  try {
    const prog = getProgress();
    if (!prog.visitedMechanisms.includes(id)) {
      prog.visitedMechanisms.push(id);
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(prog));
    }
  } catch (e) {
    console.warn(e);
  }
};

export const markScenarioCompleted = (scenarioId) => {
  try {
    const prog = getProgress();
    if (!prog.completedScenarios.includes(scenarioId)) {
      prog.completedScenarios.push(scenarioId);
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(prog));
    }
  } catch (e) {
    console.warn(e);
  }
};

export const getRecentSimulations = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_SIMS);
    return data ? JSON.parse(data) : ['pipes', 'message-queues', 'shared-memory'];
  } catch (e) {
    return ['pipes', 'message-queues', 'shared-memory'];
  }
};

export const addRecentSimulation = (id) => {
  try {
    let recents = getRecentSimulations().filter(item => item !== id);
    recents.unshift(id);
    recents = recents.slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.RECENT_SIMS, JSON.stringify(recents));
  } catch (e) {
    console.warn(e);
  }
};

export const getQuizHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    return data ? JSON.parse(data) : { highScores: {}, completedQuizzes: [] };
  } catch (e) {
    return { highScores: {}, completedQuizzes: [] };
  }
};

export const saveQuizScore = (quizId, score, total) => {
  try {
    const history = getQuizHistory();
    const prev = history.highScores[quizId] || 0;
    if (score > prev) {
      history.highScores[quizId] = score;
    }
    history.completedQuizzes.push({
      quizId,
      score,
      total,
      date: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(history));
  } catch (e) {
    console.warn(e);
  }
};

