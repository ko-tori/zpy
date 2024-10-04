import { Play } from './Play';
import { Card, BasicSuit, getSuit } from './Card';
import { Matcher } from './Matcher';

const RULES = {
    wraparound: true,
};

export function selectableCards(hand: Card[], selection: Card[], trick: Play[], declared: Card) {
    const n = trick.reduce((t, p) => t + p.size, 0);
    const suit: BasicSuit | 'T' = trick[0].getSuit(declared);
    const suitedCards = hand.filter(card => getSuit(card, declared) === suit);

    if (suitedCards.length > n) {
        const need = Play.sortPlays(trick);
        const responseShape = [];
        const matches = new Matcher(suitedCards, trick[trick.length - 1], declared);
        while (need.length) {
            const subTrick = need.pop();

        }
    } else if (selection.length < n) {
        return hand;
    }

    // Determine # suited cards
    // if enough, disable all non suited cards, proceed with forcing alg
    // else if some suited cards, enable all other cards until enough non suited are selected
    // else allow any, keep in mind trump can still win if matching pattern

    // forcing alg
    // const need = copy trick
    // const responseShape = [];
    // const suitedCards = hand.filter(SAMESUITASTRICK)
    // while need has stuff:
    //   subtrick = need.popend()
    //   const bestPlay = matchPlay(suitedCards, subtrick, declared)
    //   responseShape.push(bestPlay)
    //   needs.push(...computeNeeds(subtrick.m, subtrick.l, bestPlay.m, bestPlay.l))
    // 
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
