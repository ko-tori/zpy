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
            const suitedCardsCount = countAsMap(suitedCards);
            const tempSelectable = new Set<Card>();
            sortPossibilities(possibility);
            let fulfilled = true;
            for (const play of possibility) {
                // console.log('analyzing play', play, selectionCountCopy, suitedCardsCount)
                if (play instanceof Play) {
                    let alreadySelected = true;
                    for (const card of play.getCards(declared)) {
                        const selectedCount = selectionCountCopy.get(card);
                        if (selectedCount) {
                            selectionCountCopy.set(card, selectedCount - 1);
                        } else {
                            tempSelectable.add(card);
                            alreadySelected = false;
                        }

                        const count = suitedCardsCount.get(card);
                        if (!count) {
                            // console.log(play, 'impossible')
                            return;
                        }
                        suitedCardsCount.set(card, count - 1);
                    }
                    if (!alreadySelected) fulfilled = false;
                    // console.log(play, `${!alreadySelected ? 'not ' : ''}already selected`)
                } else {
                    let alreadySelected = false;
                    for (const [card, count] of selectionCountCopy) {
                        if (count >= play.m) {
                            selectionCountCopy.set(card, count - play.m);
                            // console.log('skipping', play, 'because selected')
                            alreadySelected = true;
                        }
                    }
                    // console.log(play, `${!alreadySelected ? 'not ' : ''}already selected`)
                    if (alreadySelected) break;
                    fulfilled = false;
                    let found = false;
                    for (const [card, count] of suitedCardsCount) {
                        if (count >= play.m) {
                            tempSelectable.add(card);
                            found = true;
                        }
                    }
                    // console.log(play, `${!found ? 'not ' : ''}found`)
                    if (!found) {
                        return;
                    }
                }
            }
            // console.log(possibility, `${!fulfilled ? 'un' : ''}fulfilled`)
            if (fulfilled) return;
            // console.log('possibility passed', possibility)
            tempSelectable.forEach(c => selectable.add(c));
        });
        return selectable;
    } else {
        const leftover = n - suitedCards.length;
        const selectedNonSuitedCards = selection.filter(card => getSuit(card, declared) !== suit).length;
        if (selectedNonSuitedCards < leftover) {
            if (suitedCards.length === selection.length - selectedNonSuitedCards) {
                return new Set(hand.filter(card => getSuit(card, declared) !== suit));
            }
            return new Set(hand);
        } else {
            return new Set(suitedCards);
        }
    }
}
