import { Card, compareCards } from './Card';
import { Play } from './Play';
import { countAsMap } from './util';

interface Shape {
    m: number;
    l: number;
}

/**
 * Encapsulates a possible play. Either it's a specific play, or a type of play without a specific card.
 */
export type Possibility = Play | Shape;

/**
 * Sorts an array of type `Possibility[]` from largest to smallest.
 * This should ensure that `Shape`s end up at the end.
 * @param possibilities Possibilities to sort.
 */
export function sortPossibilities(possibilities: Possibility[]) {
    possibilities.sort((p1, p2) => {
        const m1 = p1 instanceof Play ? p1.multiplicity : p1.m;
        const m2 = p2 instanceof Play ? p2.multiplicity : p2.m;
        const l1 = p1 instanceof Play ? p1.length : p1.l;
        const l2 = p2 instanceof Play ? p2.length : p2.l;
        const comp = m2 * l2 - m1 * l1 || m2 - m1;
        if (comp === 0 && p1 instanceof Play && p2 instanceof Play) {
            return compareCards(p2.card, p1.card);
        }
        return comp;
    });
}

/**
 * Assumes (m,l) fits (M,L) shape.
 * Example: 3, 3, 2, 2 => [[3, 1],[1,1],[1,1]]
 *  AAA xxx
 *  KKK y33
 *  QQQ z44  -> z is separate bc [1,2] shape is invalid
 * 
 * Example: 4, 4, 2, 2 => [[4,2],[2,2]]
 *  AAAA xxxx
 *  KKKK xxxx
 *  QQQQ yy44
 *  JJJJ yy33
 */
export function computeNeeds(M: number, L: number, m: number, l: number) {
    const needs = [];
    if (L - l > 0) {
        needs.push([M, L - l]);
    }
    if (M - m === 1) {
        for (let i = 0; i < l; i++) {
            needs.push([1, 1]);
        }
    } else if (M - m > 0) {
        needs.push([M - m, l]);
    }
    return needs;
}

/**
 * This class contains utilities to calculate all possible plays from a hand somewhat efficiently.
 * This is important to detemine what cards can be selectable.
 */
export class Matcher {
    private handStructure: Map<Card, number>[][];
    private trick: Play[];

    constructor(private counts: Map<Card, number>, trick: Play[], private declared: Card, private initial = false) {
        this.trick = Play.sortPlays(trick);
        const maxTrick = this.trick[this.trick.length - 1];
        const dp: Map<Card, number>[][] = Array(maxTrick.multiplicity - 1).fill(null).map(() => Array(maxTrick.length).fill([]));

        for (let m = 2; m <= maxTrick.multiplicity; m++) {
            const entry = new Map<Card, number>();
            this.counts.forEach((count, card) => {
                if (count >= m) {
                    entry.set(card, Math.floor(count / m));
                }
            })
            dp[m - 2][0] = entry;
        }

        for (let m = 2; m <= maxTrick.multiplicity; m++) {
            const first = dp[m - 2][0];
            for (let l = 2; l <= maxTrick.length; l++) {
                const prev = dp[m - 2][l - 2];
                const entry = new Map<Card, number>();
                prev.forEach((count, card) => {
                    const nextCard = new Play(card, m, l - 1).nextLargest(this.declared, l === 2);
                    if (!nextCard) return;
                    const nextCardCt = first.get(nextCard);
                    if (nextCardCt) {
                        entry.set(card, Math.min(count, nextCardCt));
                    }
                });
                dp[m - 2][l - 1] = entry;
            }
        }

        this.handStructure = dp;
    }

    getPossibilities() {
        const temp = this.trick[this.trick.length - 1];
        // console.log(`getting possible plays for ${temp.multiplicity}x${temp.length}`);
        if (!this.counts.size && this.initial) {
            return [[]];
        }
        if (this.trick.length === 1 && temp.multiplicity === 1 && temp.length === 1 && !this.initial) {
            // console.log('returning single', this.counts.size)
            return this.counts.size ? [[{ m: 1, l: 1 }]] : [];
        }
        const plays: Possibility[][] = [];
        const [m, l] = this.getBest();
        // console.log('best size', m, l);
        if (m <= 2 && l === 1 && !this.initial) {
            const play = { m, l };
            const newCounts = new Map(this.counts);
            let found = false;
            let lastCard, lastCount;
            for (let i = 0; i < l; i++) {
                for (let [card, count] of newCounts) {
                    if (count === m) {
                        newCounts.delete(card);
                        found = true;
                        break;
                    }
                    if (count > m) {
                        lastCard = card;
                        lastCount = count;
                    }
                }
            }
            if (!found) {
                if (lastCard && lastCount) {
                    newCounts.set(lastCard, lastCount - m);
                } else {
                    throw new Error(`Failed to find candidate for ${m}x${l}.`);
                }
            }
            plays.push(...this.possibilitiesHelper(play, m, l, newCounts));
        } else {
            for (const [card, _] of this.getEntry(m, l)) {
                // console.log(card, m, l);
                const play = new Play(card, m, l);
                const newCounts = new Map(this.counts);
                play.getCards(this.declared).forEach(cardToRemove => {
                    const curCount = newCounts.get(cardToRemove);
                    if (!curCount) {
                        throw new Error(`Cannot remove card ${card}.`);
                    } else if (curCount === 1) {
                        newCounts.delete(cardToRemove);
                    } else {
                        newCounts.set(cardToRemove, curCount - 1);
                    }
                });
                plays.push(...this.possibilitiesHelper(play, m, l, newCounts));
            }
        }
        // console.log(`found possible plays for ${temp.multiplicity}x${temp.length}`, plays);
        const minSize = Math.min(...plays.map(p => p.length));
        const possibilities = plays.filter(p => p.length === minSize);
        return this.initial ? [Play.sortPlays(possibilities[0] as Play[]).reverse()] : possibilities;
    }

    private getEntry(m: number, l: number) {
        if (m === 1 && l === 1) {
            return this.counts;
        }
        return this.handStructure[m - 2][l - 1];
    }

    private getBest() {
        // console.log('getting best', this.trick[this.trick.length - 1])
        let bestM = 1, bestL = 1;
        for (let m = this.handStructure.length + 1; m >= 2; m--) {
            for (let l = this.handStructure[0].length; l >= 1; l--) {
                // console.log(this.getEntry(m, l).size, bestM, bestL, m, l)
                if (this.getEntry(m, l).size && (m * l > bestM * bestL || (bestM * bestL === m * l && m > bestM))) {
                    bestM = m;
                    bestL = l;
                }
            }
        }
        return [bestM, bestL];
    }

    private possibilitiesHelper(play: Possibility, m: number, l: number, newCounts: Map<Card, number>) {
        const newTrick = this.trick.map(trick => trick.copy());
        const targetPlay = newTrick.pop();
        if (!targetPlay) {
            // console.log('targets ran out')
            return [];
        }
        computeNeeds(targetPlay.multiplicity, targetPlay.length, m, l).forEach(([m2, l2]) => {
            newTrick.push(new Play(targetPlay.card, m2, l2));
        });
        // console.log('newTrick', newTrick)
        if (newTrick.length === 0) {
            // console.log('returning', play);
            return [[play]];
        } else {
            const newMatcher = new Matcher(newCounts, newTrick, this.declared, this.initial);
            const possibilities = newMatcher.getPossibilities();
            // console.log('possibilities', possibilities);
            return possibilities.map(possibility => [play as Possibility].concat(possibility));
        }
    }

    static fromHand(hand: Card[], trick: Play[], declared: Card) {
        return new Matcher(countAsMap(hand), trick, declared);
    }

    static initialThrow(hand: Card[], maxMultiplicity: number, declared: Card) {
        return new Matcher(countAsMap(hand), [
            // Card here doesn't matter as it's a placeholder.
            new Play('2C', maxMultiplicity, Math.ceil(hand.length / maxMultiplicity))],
            declared, true);
    }
}