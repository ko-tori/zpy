import { Card, createDeck, BasicNum, BASIC_NUMS, parseCard, isPoints } from "./Card";
import { Settings, updateSettings, settingsInvalid, SETTINGS } from "./settings";
import { Play } from './Play';

type GamePhase = 'deal' | 'bottom' | 'play' | 'score';
/**
 * Represents a player in the game.
 * GameState tracks minimal information about the player, and uses their index to refer to them.
 */
export class Player {
    constructor(public rank: BasicNum = '2', public hand: Card[] = [], public points: Card[] = []) { }

    incrementRank(n = 1) {
        this.rank = BASIC_NUMS[BASIC_NUMS.indexOf(this.rank) + n];
    }
}

interface Declaration {
    card: Card;
    amount: number;
    player: number;
    canBeOverturned: boolean; // Is true when the previous declarer can reinforce.
}

interface FriendCall {
    card: Card;
    nth: number;
}

export class GameState {
    /** The phase of the game. Starts with score and waits for `startGame` to change to `'deal'`. */
    public phase = 'score';
    public deck: Card[] = [];
    public players: Player[];
    public bottom: Card[] = [];
    public bottomSize: number;
    public declared?: Declaration;
    public declarations: Declaration[] = [];
    public teamSize: number;
    public friendCalls?: FriendCall[];
    public friends = new Set<number>();
    public winners: number[];
    public currentTurn = 0;
    public currentTrick: Play[][] = [];

    constructor(public settings: Partial<Settings>) {
        updateSettings(settings);
        const settingsError = settingsInvalid();
        if (settingsError) throw new Error(settingsError);
        this.players = new Array(SETTINGS.numPlayers).fill(null).map(p => new Player());
        this.winners = this.players.map((_, i) => i);
        if (!SETTINGS.bottomSize) {
            let bottomSize = ((54 * SETTINGS.numDecks) % SETTINGS.numPlayers);
            while (bottomSize < 6 - SETTINGS.numPlayers / 2) {
                bottomSize += SETTINGS.numPlayers;
            }
            this.bottomSize = bottomSize;
        } else {
            this.bottomSize = SETTINGS.bottomSize;
        }
        this.teamSize = SETTINGS.teamSize ?? Math.floor(SETTINGS.numPlayers / 2);
    }

    startGame() {
        if (this.phase !== 'score') throw new Error('Game can only be started in score phase.');
        this.phase = 'deal';
        this.bottom = [];
        this.friends = new Set();
        this.deck = createDeck();
        this.declarations = [];
    }

    dealCard() {
        if (this.phase !== 'deal') throw new Error('Cards can only be dealt in deal phase.');
        if (this.deck.length === this.bottomSize) return null;
        const card = this.deck.pop();
        if (!card) return null;
        this.players[this.currentTurn].hand.push(card);
        this.incrementTurn();
        return card;
    }

    declare(player: number, card: Card, amount: number): Declaration {
        if (this.phase !== 'deal') throw new Error('Can only declare in deal phase.');
        if (parseCard(card)[0] !== this.players[player].rank) throw new Error('Player trying to declare out of rank.');
        if (SETTINGS.winnersDeclare && this.winners.indexOf(player) === -1) throw new Error('Only winners may declare.');
        const prevDeclaration = this.declarations[this.declarations.length - 1];
        if (amount < prevDeclaration.amount) throw new Error('Not enough cards to overturn.');
        if (amount === prevDeclaration.amount && prevDeclaration.canBeOverturned) { // Someone trying to reinforce.
            const origDeclaration = this.declarations[this.declarations.length - 2];
            if (!origDeclaration || player !== origDeclaration.player || card !== origDeclaration.card) throw new Error('Invalid reinforce.');
        }
        const canBeOverturned = this.players[prevDeclaration.player].hand.filter(c => c === card).length >= amount;
        const declaration = { card, amount, player, canBeOverturned };
        this.declarations.push(declaration);
        return declaration; // canBeOverturned should be redacted before sending to the other players that can't reinforce.
    }

    endDealPhase() {
        if (this.phase !== 'deal') throw new Error('Not in deal phase.');
        this.declared = this.declarations[this.declarations.length - 1];
        this.phase = 'bottom';
        this.currentTurn = this.declared.player;
        return this.deck; // Should be sent to declared.player
    }

    endBottomPhase(bottom: Card[], friendCalls: FriendCall[]) {
        if (this.phase !== 'bottom') throw new Error('Not in bottom phase.');
        if (friendCalls.length !== this.teamSize) throw new Error(`Need to call ${this.teamSize} friends.`);
        this.bottom = bottom;
        this.friendCalls = friendCalls;
        this.phase = 'play';
    }

    makePlay(play: Play[]) {
        if (this.phase !== 'play') throw new Error('Not in play phase.');
        if (this.currentTrick.length === 0 && play.length > 1) {
            // TODO: check if throw is valid
        }
        const player = this.players[this.currentTurn];
        const cards: Card[] = [];
        for (const p of play) {
            cards.push(...p.getCards(this.declared!.card));
        }
        for (const c of cards) {
            const i = player.hand.indexOf(c);
            if (i === -1) throw new Error('Card not in hand.');
            player.hand.splice(i, 1);
        }
        this.currentTrick.push(play);
        if (this.currentTrick.length === this.players.length) {
            // Conclude trick
            this.incrementTurn();
            const [winner, points] = this.computeWinner();
            this.currentTurn = winner;
            if (!this.friends.has(winner)) this.players[winner].points.push(...points);
            this.currentTrick = [];
            if (this.players[0].hand.length === 0) {
                this.phase = 'score';
                this.calculateScore();
            }
            return [winner, points];
        }
        return null;
    }

    private computeWinner(): [number, Card[]] {
        if (this.currentTrick.length !== this.players.length) throw new Error('Trick still in progress.');
        const points: Card[] = [];
        let currentWinner = 0;
        for (let i = 0; i < this.currentTrick.length; i++) {
            const play = this.currentTrick[i];
            if (i > 0 && !Play.winsAgainst(this.currentTrick[currentWinner], play, this.declared!.card)) {
                currentWinner = i;
            }
            for (const p of play) {
                for (const card of p.getCards(this.declared!.card)) {
                    if (isPoints(card)) points.push(card);
                }
            }
        }
        return [0, points]; // TODO actually compute winner.
    }

    private calculateScore() {
        // Count team points, increment ranks as needed.
    }

    private incrementTurn() {
        this.currentTurn = (this.currentTurn + 1) % SETTINGS.numPlayers;
    }
}