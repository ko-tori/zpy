export interface Settings {
    numDecks: number;
    numPlayers: number;
    wraparound: boolean;
    winnersDeclare: boolean;
    rallyScoring: boolean;
    teamSize?: number;
    bottomSize?: number;
    cutoffPerDeck: number;
    bottomMultiplier: number;
}

const DEFAULT_SETTINGS: Settings = {
    wraparound: true,
    numDecks: 0,
    numPlayers: 0,
    winnersDeclare: true,
    rallyScoring: true,
    teamSize: undefined,
    bottomSize: undefined,
    cutoffPerDeck: 40,
    bottomMultiplier: 2
};

export const SETTINGS: Settings = Object.create(DEFAULT_SETTINGS);

export function updateSettings(settings: Partial<Settings>) {
    Object.assign(SETTINGS, settings);
}

export function settingsInvalid() {
    if (SETTINGS.numDecks === 0) return 'Must not have 0 decks.';
    if (SETTINGS.numPlayers < 2) return 'Must have at least 2 players.'
    if (SETTINGS.bottomSize && (SETTINGS.numDecks * 54 - SETTINGS.bottomSize) % SETTINGS.numPlayers) return 'Invalid bottom size.';
    return '';
}

export function resetSettings() {
    Object.assign(SETTINGS, DEFAULT_SETTINGS);
}