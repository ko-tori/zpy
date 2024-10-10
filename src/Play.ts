import { Card, nextLargest, getSuit, compareCards } from './Card';

/**
 * Represents one group of cards, e.g. singles, pairs, triples, and tractors.
 * These groups can be described by their lowest card `c`, multiplicity `m`, and length `l`.
 * Multiplicity and length default to 1 if not specified.
 * Examples:
 * - Single Ace of Clubs => `{c: 'AC'}`
 * - Pair of King of Diamonds => `{c: 'KD', m: 2}`
 * - 2233 of Spades Tractor => `{c: '2S', m: 2, l: 2}`
 */
export class Play {
    constructor(private c: Card, private m?: number, private l?: number) {
        if (m !== undefined && m < 1) {
            throw new TypeError('Cannot have multiplicity < 1.');
        }
        if (l !== undefined && l < 1) {
            throw new TypeError('Cannot have length < 1.');
        }
        if (l && m && l > 1 && m == 1) {
            throw new TypeError('Cannot have tractors of multiplicity 1.');
        }
        if (m === 1) this.m = undefined;
        if (l === 1) this.l = undefined;
    }

    /**
     * Gets an array of cards which the current play represents.
     * Examples (3C declared): 
     * - Single Ace of Clubs => `{c: 'AC'}` => `['AC']`
     * - Pair of King of Diamonds => `{c: 'KD', m: 2}` => `['KD', 'KD']`
     * - 2233 of Spades Tractor => `{c: '2S', m: 2, l: 2}` => `['2C', '2C', '3C', '3C']`
     * - 2244 of Clubs Tractor => `{c: '2C', m: 2, l: 2}` => `['2C', '2C', '4C', '4C']`
     * - Big tractor => `{c: '3C', m: 2, l: 3}` => `['3C', '3C', 'SJ', 'SJ', 'BJ', 'BJ']`
     * @param declared The currently declared card.
     * @returns An array of the cards in the current play.
     */
    getCards(declared: Card) {
        const cards: Card[] = [];
        let curCard: Card | null = this.c;

        for (let i = 0; i < this.length; i++) {
            if (!curCard) {
                throw new RangeError('Play goes out of range.');
            }
            for (let j = 0; j < (this.multiplicity); j++) {
                cards.push(curCard);
            }
            curCard = nextLargest(curCard, declared, i === 0);
        }
        return cards;
    }

    /** For tractors, the next card which would extend the tractor. */
    nextLargest(declared: Card, wrap = false) {
        let c: Card | null = this.c;
        for (let i = 0; i < this.length; i++) {
            if (!c) return null;
            c = nextLargest(c, declared, wrap);
        }
        return c;
    }

    get card() {
        return this.c;
    }

    get size() {
        return this.multiplicity * this.length;
    }

    get multiplicity() {
        return this.m ?? 1;
    }

    get length() {
        return this.l ?? 1;
    }

    getSuit(declared: Card) {
        return getSuit(this.c, declared);
    }

    copy() {
        return new Play(this.c, this.m, this.l);
    }

    /**
     * Used to group like plays, with precedence defined as the following:
     * - Singles are the lowest, followed by pairs and triples.
     * - Other combinations are tiebroken by size (multiplicity x length).
     * - If there is still a tie (e.g. 2x3 vs. 3x2), multiplicity tiebreaks.
     */
    static sortPlays(plays: Play[], declared?: Card) {
        return plays.toSorted((p1, p2) => {
            return p1.size - p2.size || p1.multiplicity - p2.multiplicity || compareCards(p1.c, p2.c, declared);
        });
    }

    /**
     * Calculates which play would be winning with `p1` played first.
     * @param p1 The current winning play.
     * @param p2 The following play.
     * @returns `true` if `p1` remains the winning play, `false` otherwise.
     */
    static winsAgainst(p1: Play[], p2: Play[], declared: Card) {
        if (p1.length !== p2.length) return true;
        const s1 = p1[0].getSuit(declared);
        for (let i = 0; i < p1.length; i++) {
            if (p1[i].multiplicity !== p2[i].multiplicity || p1[i].length !== p2[i].length) {
                return true;
            } else {
                const s2 = p2[i].getSuit(declared);
                if (s1 !== s2 && s2 !== 'T') {
                    return true;
                }
                if (s1 === s2 && compareCards(p1[i].card, p2[i].card, declared) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }
}