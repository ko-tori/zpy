import { BasicSuit, Card } from "../src/Card";

export function createSuitedHand(n: string, suit: BasicSuit = 'C') {
    return n.split('').map(i => `${i === 'T' ? 10 : i}${suit}` as Card);
}

export const TEST_DECK_FACTORY: () => Card[] = () => ["4D", "5H", "5H", "8C", "KD", "10S", "3S", "6D", "4C", "9D", "10D", "10D", "3C", "JH", "4S", "JC", "5D", "7C", "2H", "8C", "QD", "8H", "6C", "10H", "5D", "4C", "7D", "9D", "9H", "7H", "QS", "3S", "7C", "10C", "SJ", "BJ", "3C", "KS", "7S", "6S", "2C", "2C", "8H", "9C", "JH", "2D", "7H", "6S", "6H", "AD", "4D", "JD", "JS", "JS", "JD", "QC", "AC", "9S", "2H", "2S", "AH", "KH", "QH", "2D", "3H", "6H", "5C", "KS", "4H", "5S", "BJ", "5C", "8D", "AS", "10S", "KC", "9H", "9C", "3D", "2S", "6C", "8S", "10C", "8D", "3D", "8S", "9S", "AH", "6D", "QH", "AD", "QC", "SJ", "AS", "AC", "QS", "KD", "7S", "QD", "7D", "3H", "10H", "4H", "JC", "KC", "KH", "5S", "4S"];