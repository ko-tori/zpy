import { Play } from './Play';
import { Card, BasicSuit, getSuit } from './Card';
import { Matcher, sortPossibilities } from './Matcher';
import { countAsMap } from './util';

export function selectableCards(hand: Card[], selection: Card[], trick: Play[], declared: Card) {
    const n = trick.reduce((t, p) => t + p.size, 0);
    const suit: BasicSuit | 'T' = trick[0].getSuit(declared);
    const suitedCards = hand.filter(card => getSuit(card, declared) === suit);
    if (suitedCards.length > n) {
        const matcher = Matcher.fromHand(suitedCards, trick, declared);
        const possibilities = matcher.getPossibilities();
        const selectionCount = countAsMap(selection);
        const selectable = new Set<Card>();
        possibilities.forEach(possibility => {
            const selectionCountCopy = new Map(selectionCount);
            sortPossibilities(possibility);
            possibility.filter(play => {
                if (play instanceof Play) {
                    play.getCards(declared).forEach(card => {
                        const count = selectionCountCopy.get(card);
                        if (count) {
                            selectionCountCopy.set(card, count - 1);
                            selectable.add(card);
                        }
                    });
                } else {
                    selectionCount.forEach((count, card) => {
                        if (count >= play.m) {
                            selectable.add(card);
                        }
                    });
                }
            });
        });
        return selectable;
    } else {
        const leftover = n - suitedCards.length;
        const nonSuitedCards = hand.filter(card => getSuit(card, declared) !== suit);
        const nonSuitedCardsCount = countAsMap(nonSuitedCards);
        const selectedNonSuitedCards = selection.reduce((t, c) => t + (nonSuitedCardsCount.get(c) ?? 0), 0);
        if (selectedNonSuitedCards < leftover) {
            return new Set(hand);
        } else {
            return new Set(suitedCards);
        }
    }
}
