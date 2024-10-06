import { BasicSuit, Card } from "../src/Card";

export function createSuitedHand(n: string, suit: BasicSuit = 'C') {
    return n.split('').map(i => `${i === 'T' ? 10 : i}${suit}` as Card);
}