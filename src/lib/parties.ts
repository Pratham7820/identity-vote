// Party metadata: emoji symbol used for visual identification across the app.
// Note: these are simplified emoji symbols, not official party logos.
export const PARTY_SYMBOLS: Record<string, string> = {
  'Bharatiya Janata Party (BJP)': '🪷',
  'Indian National Congress (INC)': '✋',
  'Aam Aadmi Party (AAP)': '🧹',
  'All India Trinamool Congress (TMC)': '🌾',
  'Communist Party of India (Marxist) (CPI-M)': '🔨',
  'Bahujan Samaj Party (BSP)': '🐘',
  'Samajwadi Party (SP)': '🚲',
  'Shiv Sena': '🏹',
  'Nationalist Congress Party (NCP)': '⏰',
  'Dravida Munnetra Kazhagam (DMK)': '☀️',
  'Independent': '🧑',
};

export function getPartySymbol(party: string): string {
  return PARTY_SYMBOLS[party] ?? '🏳️';
}

export const INDIAN_PARTIES = Object.keys(PARTY_SYMBOLS);
