// Party metadata: emoji symbol used for visual identification across the app.
// Note: these are simplified emoji symbols, not official party logos.
export const PARTY_SYMBOLS: Record<string, string> = {
  'Bharatiya Janata Party (BJP)': '/bjp.jpg',
  'Indian National Congress (INC)': '/inc.webp',
  'Aam Aadmi Party (AAP)': '/aap.webp',
  'All India Trinamool Congress (TMC)': '/tmc.webp',
  'Communist Party of India (Marxist) (CPI-M)': '/cpim.webp',
  'Bahujan Samaj Party (BSP)': '/bsp.jpg',
  'Samajwadi Party (SP)': '/smp.png',
};

export function getPartySymbol(party: string): string {
  return PARTY_SYMBOLS[party] ?? '🏳️';
}

export const INDIAN_PARTIES = Object.keys(PARTY_SYMBOLS);
