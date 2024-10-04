import { Card } from './Card';
import { Play } from './Play';

export class Matcher {
    private possiblePlays;

    constructor(hand: Card[], trick: Play, declared: Card) {
        const dp: Map<Card, number>[][] = Array(trick.multiplicity - 1).fill(null).map(() => Array(trick.length).fill([]));

        const counts = new Map<Card, number>();
        hand.forEach(card => {
            counts.set(card, 1 + (counts.get(card) ?? 0));
        });

        for (let m = 2; m <= trick.multiplicity; m++) {
            const entry = new Map<Card, number>();
            counts.forEach((count, card) => {
                if (count >= m) {
                    entry.set(card, Math.floor(count / m));
                }
            })
            dp[m - 2][0] = entry;
        }

        for (let m = 2; m <= trick.multiplicity; m++) {
            const first = dp[m - 2][0];
            for (let l = 2; l <= trick.length; l++) {
                const prev = dp[m - 2][l - 2];
                const entry = new Map<Card, number>();
                prev.forEach((count, card) => {
                    const nextCard = new Play(card, m, l - 1).nextLargest(declared);
                    if (!nextCard) return;
                    if (first.has(nextCard)) {
                        entry.set(card, 1 + (entry.get(card) ?? 0));
                    }
                });
                dp[m - 2][l - 1] = entry;
            }
        }

        this.possiblePlays = dp;
        console.log(dp)
    }

    removePlay(play: Play) {
        const entry = this.getEntry(play.multiplicity, play.length);
        const count = entry.get(play.card);
        if (!count) {
            throw new Error('Play not found');
        }

    }

    private getEntry(m: number, l: number) {
        return this.possiblePlays[m - 2][l - 1];
    }
}
new Matcher(['3H', '3H', '4H', '4H', '4H', '4H', '5H', '5H', '7H', '7H', '7H', '8H', '8H', '8H', 'KH', 'AH'], new Play('10H', 3, 3), '2C')
