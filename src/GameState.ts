import { Card, createDeck, BasicNum, BASIC_NUMS, parseCard, getPointValue, getSuit, compareCards } from "./Card";
import { Settings, updateSettings, settingsInvalid, SETTINGS } from "./settings";
import { Play } from './Play';
import { Matcher, matchesPossibility } from "./Matcher";
import { countAsMap } from "./util";

export type GamePhase = 'deal' | 'bottom' | 'play' | 'score';

/**
 * Represents a player in the game.
 * GameState tracks minimal information about the player, and uses their index to refer to them.
 */
export class Player {
    constructor(public rank: BasicNum = '2', public hand: Card[] = [], public points: Card[] = []) { }

    /** Returns true if the player has won. */
    incrementRank(n = 1) {
        this.rank = BASIC_NUMS[BASIC_NUMS.indexOf(this.rank) + n];
        return !this.rank;
    }

    newRound() {
        this.points = [];
        this.hand = [];
    }
}

export interface Declaration {
    card: Card;
    amount: number;
    player: number;
    canPrevPlayerReinforce: boolean;
    prevPlayer?: number;
}

export interface DealPhaseResult {
    dealer: number;
    bottom: Card[];
}

export interface FriendCall {
    card: Card;
    nth: number;
}

export interface RoundResult {
    winners: number[];
    levelChange: number;
    gameWinners: number[];
    points: number;
    bottom: Card[];
}

export interface RejectedThrow {
    forcedPlay: Play;
}

export interface TrickResult {
    winner: number;
    points: Card[];
}

export type PlayResult = RoundResult | RejectedThrow | TrickResult | null;

export class GameState {
    /** The phase of the game. Starts with score and waits for `startRound` to change to `'deal'`. */
    public phase: GamePhase = 'score';
    public deck: Card[] = [];
    public players: Player[];
    public bottom: Card[] = [];
    public bottomSize: number;
    public declared?: Card;
    public declarations: Declaration[] = [];
    public teamSize: number;
    public friendCalls?: FriendCall[];
    public friends = new Set<number>();
    public winners: number[];
    public currentTurn = 0;
    public currentTrick: Play[][] = [];

    constructor(settings: Partial<Settings>) {
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

    startRound() {
        if (this.phase !== 'score') throw new Error('Game can only be started in score phase.');
        this.phase = 'deal';
        this.bottom = [];
        this.friends = new Set();
        this.deck = createDeck();
        this.declarations = [];
        this.players.forEach(p => p.newRound());
    }

    dealCard() {
        if (this.phase !== 'deal') throw new Error('Cards can only be dealt in deal phase.');
        if (this.deck.length === this.bottomSize) return null;
        const card = this.deck.pop();
        if (!card) return null;
        this.currentPlayer.hand.push(card);
        this.incrementTurn();
        return card;
    }

    declare(player: number, card: Card, amount = 1): Declaration {
        if (this.phase !== 'deal') throw new Error('Can only declare in deal phase.');
        if (parseCard(card)[0] !== this.players[player].rank) throw new Error('Player trying to declare out of rank.');
        if (SETTINGS.winnersDeclare && this.winners.indexOf(player) === -1) throw new Error('Only winners may declare.');
        if (this.players[player].hand.filter(c => c === card).length < amount) throw new Error('Player trying to declare with cards they don\'t have.');
        const prevDeclaration = this.declarations[this.declarations.length - 1];
        if (prevDeclaration) {
            if (amount === prevDeclaration.amount && prevDeclaration.canPrevPlayerReinforce) { // Someone trying to reinforce.
                const origDeclaration = this.declarations[this.declarations.length - 2];
                if (!origDeclaration || player !== origDeclaration.player || card !== origDeclaration.card) throw new Error('Invalid reinforce.');
            } else if (amount <= prevDeclaration.amount) throw new Error('Not enough cards to overturn.');
        }
        const canPrevPlayerReinforce = prevDeclaration ? prevDeclaration.amount < amount && this.players[prevDeclaration.player].hand.filter(c => c === prevDeclaration.card).length >= amount : false;
        const declaration = { card, amount, player, canPrevPlayerReinforce, prevPlayer: canPrevPlayerReinforce ? prevDeclaration?.player : undefined };
        this.declarations.push(declaration);
        return declaration; // canPrevPlayerReinforce should only be sent to prevPlayer.
    }

    endDealPhase(): DealPhaseResult {
        if (this.phase !== 'deal') throw new Error('Not in deal phase.');
        this.declared = this.declarations[this.declarations.length - 1].card;
        this.phase = 'bottom';
        this.currentTurn = this.declarations[this.declarations.length - 1].player;
        this.friends.add(this.currentTurn);
        const dealerHand = this.currentPlayer.hand;
        dealerHand.push(...this.deck);
        this.players.forEach(p => p.hand.sort((a, b) => compareCards(a, b, this.declared!)));
        return { dealer: this.currentTurn, bottom: this.deck }; // Should be sent to declared.player
    }

    endBottomPhase(bottom: Card[], friendCalls: FriendCall[]) {
        if (this.phase !== 'bottom') throw new Error('Not in bottom phase.');
        if (friendCalls.length !== this.teamSize - 1) throw new Error(`Need to call ${this.teamSize - 1} friend${this.teamSize === 2 ? '' : 's'}.`);
        if (bottom.length !== this.bottomSize) throw new Error(`Bottom must be ${this.bottomSize} cards.`);
        if (!this.validateSelection(bottom)) throw new Error('Bottom includes card not in hand.');
        const dealerHand = this.currentPlayer.hand;
        for (const card of bottom) {
            dealerHand.splice(dealerHand.findIndex(c => c === card), 1);
        }
        this.bottom = bottom;
        this.friendCalls = friendCalls;
        this.phase = 'play';
    }

    makePlay(play: Play[]): PlayResult {
        if (this.phase !== 'play') throw new Error('Not in play phase.');
        play = Play.sortPlays(play, this.declared).reverse();
        let forced = false;
        if (this.currentTrick.length === 0 && play.length > 1) {
            if (!this.checkThrowSuited(play)) throw Error('Throw is not suited.');
            const forcedPlay = this.checkThrowValid(play);
            if (forcedPlay) {
                forced = true;
                play = [forcedPlay];
            }
        }
        const player = this.currentPlayer;
        const cards: Card[] = [];
        for (const p of play) {
            cards.push(...p.getCards(this.declared!));
        }
        if (!this.validateSelection(cards)) throw new Error('Player is trying to play cards they don\'t have.');
        if (!this.isValidPlay(play)) throw new Error('Player is not allowed to play that.');
        for (const c of cards) {
            for (const friend of this.friendCalls!) {
                if (c === friend.card) {
                    if (friend.nth === 1) {
                        this.friends.add(this.currentTurn);
                        this.currentPlayer.points = [];
                    } else {
                        friend.nth -= 1;
                    }
                }
            }
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
                return this.calculateScore();
            }
            return { winner, points };
        }
        this.incrementTurn();
        return forced ? { forcedPlay: play[0] } : null;
    }

    private get currentPlayer() {
        return this.players[this.currentTurn];
    }

    private checkThrowSuited(play: Play[]) {
        const suit = play[0].getSuit(this.declared!);
        for (const p of play) {
            if (p.getSuit(this.declared!) !== suit) return false;
        }
        return true;
    }

    private isValidPlay(play: Play[]) {
        if (this.currentTrick.length === 0) return true;
        const trick = this.currentTrick[0];
        const trickSize = trick.reduce((t, p) => t + p.size, 0);
        const playSize = play.reduce((t, p) => t + p.size, 0);
        if (trickSize !== playSize) return false;
        const suit = getSuit(this.currentTrick[0][0].card, this.declared!);
        const suitedCards = this.currentPlayer.hand.filter(c => getSuit(c, this.declared!) === suit);
        const playNumSuitedCards = play.filter(p => p.getSuit(this.declared!) === suit).reduce((a, p) => a + p.size, 0);
        if (suitedCards.length > trickSize) {
            if (playNumSuitedCards !== trickSize) return false;
            for (const possibility of Matcher.fromHand(suitedCards, this.currentTrick[0], this.declared!).getPossibilities()) {
                if (matchesPossibility(play, possibility, this.declared!)) return true;
            }
            return false;
        }
        return playNumSuitedCards === suitedCards.length;
    }

    private checkThrowValid(play: Play[]) {
        const n = this.players.length;
        for (const p of play) {
            const suit = getSuit(p.card, this.declared!);
            for (let i = 1; i < n; i++) {
                const suitedCards = this.players[(this.currentTurn + i) % n].hand.filter(c => getSuit(c, this.declared!) === suit);
                if (Matcher.fromHand(suitedCards, [p], this.declared!).beatsTrick()) {
                    return p;
                }
            }
        }
        return null;
    }

    private computeWinner(): [number, Card[]] {
        if (this.currentTrick.length !== this.players.length) throw new Error('Trick still in progress.');
        const points: Card[] = [];
        let currentWinner = 0;
        for (let i = 0; i < this.currentTrick.length; i++) {
            const play = this.currentTrick[i];
            if (i > 0 && !Play.winsAgainst(this.currentTrick[currentWinner], play, this.declared!)) {
                currentWinner = i;
            }
            for (const p of play) {
                for (const card of p.getCards(this.declared!)) {
                    if (getPointValue(card)) points.push(card);
                }
            }
        }
        return [(this.currentTurn + currentWinner) % this.players.length, points];
    }

    private calculateScore(): RoundResult {
        const cutoff = SETTINGS.numDecks * SETTINGS.cutoffPerDeck;
        let points = 0;
        const defenders = [];
        for (let i = 0; i < this.players.length; i++) {
            if (!this.friends.has(i)) {
                defenders.push(i);
                for (const c of this.players[i].points) {
                    points += getPointValue(c);
                }
            }
        }
        if (!this.friends.has(this.currentTurn)) {
            for (const card of this.bottom) {
                points += getPointValue(card) * SETTINGS.bottomMultiplier;
            }
        }
        let multiplier = 1;
        let winners: number[];
        if (points >= cutoff) {
            winners = defenders;
        } else {
            multiplier = this.teamSize - this.friends.size + 1;
            winners = [...this.friends];
        }
        const levelChange = multiplier * (points === 0 ? 3 : Math.abs(Math.floor((points - cutoff) * 2 / cutoff)));
        this.winners = winners;
        const gameWinners: number[] = [];
        for (const p of winners) {
            if (this.players[p].incrementRank(levelChange)) {
                gameWinners.push(p);
            }
        }
        return { winners, levelChange, gameWinners, points, bottom: this.bottom };
    }

    private incrementTurn() {
        this.currentTurn = (this.currentTurn + 1) % SETTINGS.numPlayers;
    }

    private validateSelection(cards: Card[], player = this.currentTurn) {
        const cardCounts = countAsMap(cards);
        const handCounts = countAsMap(this.players[player].hand);
        for (const [card, count] of cardCounts) {
            if ((handCounts.get(card) ?? 0) < count) return false;
        }
        return true;
    }
}