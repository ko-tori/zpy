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
        const matcher = new Matcher(Matcher.countHand(suitedCards), trick, declared);
        const responses = matcher.getPossibilities();
    } else if (selection.length < n) {
        return hand;
    }
}
