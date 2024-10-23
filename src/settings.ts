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

export const DEFAULT_SETTINGS: Settings = {
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
