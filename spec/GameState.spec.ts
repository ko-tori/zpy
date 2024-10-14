import { GameState } from "../src/GameState";
import { Play } from "../src/Play";
import { resetSettings, SETTINGS } from "../src/settings";
import { TEST_DECK } from "./util";

describe('Simulate full game -', () => {
    it('should work', () => {
        resetSettings();
        const gameState = new GameState({ numDecks: 2, numPlayers: 5 });

        // phase should start as 'score'
        expect(gameState.phase).toBe('score');

        // settings should be set correctly
        expect(SETTINGS.numDecks).toBe(2);
        expect(SETTINGS.numPlayers).toBe(5);
        expect(gameState.players.length).toBe(5)
        expect(gameState.bottomSize).toBe(8);
        expect(gameState.teamSize).toBe(2);

        // test calling other handlers in score phase
        expect(() => gameState.dealCard()).toThrowError('Cards can only be dealt in deal phase.');
        expect(() => gameState.declare(0, '2C', 1)).toThrowError('Can only declare in deal phase.');
        expect(() => gameState.endDealPhase()).toThrowError('Not in deal phase.');
        expect(() => gameState.endBottomPhase([], [])).toThrowError('Not in bottom phase.');
        expect(() => gameState.makePlay([])).toThrowError('Not in play phase.');

        gameState.startRound();
        expect(() => gameState.startRound()).toThrowError('Game can only be started in score phase.');

        gameState.deck = TEST_DECK; // Need to mock deck since its normally shuffled.

        for (let i = 0; i < 90; i++) gameState.dealCard();
        expect(() => gameState.declare(0, '3C', 1)).toThrowError('Player trying to declare out of rank.');
        expect(() => gameState.declare(0, '2C', 1)).toThrowError('Player trying to declare with cards they don\'t have.');
        expect(gameState.declare(3, '2S', 1)).toEqual({ card: '2S', amount: 1, player: 3, canPrevPlayerReinforce: false, prevPlayer: undefined });
        expect(() => gameState.declare(4, '2H', 1)).toThrowError('Not enough cards to overturn.');
        expect(gameState.declare(4, '2H', 2)).toEqual({ card: '2H', amount: 2, player: 4, canPrevPlayerReinforce: true, prevPlayer: 3 });
        expect(gameState.declare(3, '2S', 2)).toEqual({ card: '2S', amount: 2, player: 3, canPrevPlayerReinforce: false, prevPlayer: undefined });
        while (gameState.dealCard()) { }
        expect(gameState.deck.length).toBe(8);

        gameState.endDealPhase();
        expect(gameState.players[gameState.currentTurn].hand.length).toBe(28);
        expect(gameState.declared).toEqual('2S');
        expect(gameState.currentTurn).toEqual(3);
        expect(() => gameState.declare(0, '3C', 1)).toThrowError('Can only declare in deal phase.');

        expect(() => gameState.endBottomPhase(['3H', '5H', '5H', '7H', 'JH', 'QH'], [{ card: 'AC', nth: 2 }])).toThrowError('Bottom must be 8 cards.')
        expect(() => gameState.endBottomPhase(['3H', '5H', '5H', '7H', 'JH', 'QH'], [{ card: 'AC', nth: 2 }, { card: 'AC', nth: 2 }])).toThrowError('Need to call 1 friend.')
        gameState.endBottomPhase(['3H', '5H', '5H', '7H', 'JH', 'QH', '3D', '4D'], [{ card: 'AC', nth: 2 }]);
        expect(gameState.players[gameState.currentTurn].hand.length).toBe(20);

        expect(() => gameState.makePlay([new Play('AC'), new Play('KC', 2)])).toThrowError('Player is trying to play cards they don\'t have.');
        expect(() => gameState.makePlay([new Play('AC'), new Play('10S', 2)])).toThrowError('Throw is not suited.');
        expect(gameState.makePlay([new Play('AC'), new Play('8C', 2)])).toBe(null);
        expect(() => gameState.makePlay([new Play('3D'), new Play('6D'), new Play('8D')])).toThrowError('Player is not allowed to play that.');
        expect(() => gameState.makePlay([new Play('4C'), new Play('6D'), new Play('8D')])).toThrowError('Player is not allowed to play that.');
        expect(gameState.makePlay([new Play('4C'), new Play('9C'), new Play('JC')])).toBe(null);
        expect(() => gameState.makePlay([new Play('3C'), new Play('6C'), new Play('9C')])).toThrowError('Player is not allowed to play that.');
        expect(gameState.makePlay([new Play('7C', 2), new Play('3C')])).toBe(null);
        expect(gameState.makePlay([new Play('5C', 2), new Play('3C')])).toBe(null);
        expect(gameState.makePlay([new Play('4C'), new Play('6C'), new Play('JC')])).toEqual({ winner: 3, points: ['5C', '5C'] });
        expect(gameState.currentTurn).toEqual(3);
        console.log(gameState.currentTrick, gameState.players);
    });

    afterAll(() => {
        resetSettings();
    });
});

describe('GameState', () => {
    describe('settingsInvalid -', () => {
        beforeEach(() => {
            resetSettings();
        });

        it('should fail if required settings not initialized', () => {
            expect(() => new GameState({})).toThrowError('Must not have 0 decks.');
            expect(() => new GameState({ numDecks: 2 })).toThrowError('Must have at least 2 players.');
        });
        it('should fail with invalid bottom size', () => {
            expect(() => new GameState({ numDecks: 2, numPlayers: 5, bottomSize: 4 })).toThrowError('Invalid bottom size.');
        });
        it('should pass with valid bottom size', () => {
            expect(() => new GameState({ numDecks: 2, numPlayers: 5, bottomSize: 13 })).toBeDefined();
        });

        afterAll(() => {
            resetSettings();
        });
    });
});