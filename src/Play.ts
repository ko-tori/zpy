import { Card, nextLargest, getSuit, compareCards } from './Card';

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
    nextLargest(declared: Card) {
        let c: Card | null = this.c;
        for (let i = 0; i < this.length; i++) {
            if (!c) return null;
            c = nextLargest(c, declared);
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
    static sortPlays(plays: Play[]) {
        return plays.toSorted((p1, p2) => {
            return p1.size - p2.size || p1.multiplicity - p2.multiplicity || compareCards(p1.c, p2.c);
        });
    }
}