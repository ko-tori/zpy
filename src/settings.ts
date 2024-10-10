export interface Settings {
    numDecks: number;
    numPlayers: number;
    wraparound: boolean;
    nonSuitedTrumpTractors: boolean; // TODO: implement support for this
    winnersDeclare: boolean;
    teamSize?: number;
    bottomSize?: number;
}

export const SETTINGS: Settings = {
    wraparound: true,
    nonSuitedTrumpTractors: false,
    numDecks: 0,
    numPlayers: 0,
    winnersDeclare: true
};

export function updateSettings(settings: Partial<Settings>) {
    Object.assign(SETTINGS, settings);
}

export function settingsInvalid() {
    if (SETTINGS.numDecks === 0) return 'Must not have 0 decks.';
    if (SETTINGS.numPlayers < 2) return 'Must have at least 2 players.'
    if (SETTINGS.bottomSize && (SETTINGS.numDecks * 54 - SETTINGS.bottomSize) % SETTINGS.numPlayers) return 'Invalid bottom size';
    return '';
}