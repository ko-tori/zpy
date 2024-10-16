import { SETTINGS } from './settings';

const SUITS = ['C', 'D', 'S', 'H', 'J'] as const;
type Suit = typeof SUITS[number];
const NUMS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'S', 'B'] as const;
type Num = typeof NUMS[number];

export const BASIC_NUMS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
/** The basic number type. */
export type BasicNum = typeof BASIC_NUMS[number];
const BASIC_SUITS = ['C', 'D', 'S', 'H'] as const;
/** The basic suit type. */
export type BasicSuit = typeof BASIC_SUITS[number];
/** The basic card type. Includes small and big joker. */
export type Card = `${BasicNum}${BasicSuit}` | 'SJ' | 'BJ';

/**
 * Create a shuffled deck using `SETTINGS.numDecks`.
 */
export function createDeck() {
    const deck: Card[] = [];
    for (let i = 0; i < SETTINGS.numDecks; i++) {
        for (const n of BASIC_NUMS) {
            for (const s of BASIC_SUITS) {
                deck.push(`${n}${s}`);
            }
        }
        deck.push('SJ', 'BJ');
    }
    shuffle(deck);
    return deck;
}

/** Fisher-Yates shuffle for better distributed randomness. */
export function shuffle(deck: Card[]) {
    for (let i = deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

const NUM_NAMES = {
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
    '10': 'Ten',
    'J': 'Jack',
    'Q': 'Queen',
    'K': 'King',
    'A': 'Ace',
    'S': 'Small',
    'B': 'Big'
};
const SUIT_NAMES = {
    'S': 'Spades',
    'H': 'Hearts',
    'D': 'Diamonds',
    'C': 'Clubs',
    'J': 'Joker'
}

/**
 * Parses a Card into a Num and a Suit.
 * Note this gives the raw suit and not one converted based on the declared card.
 * @param card Card to parse.
 * @returns The number of the card, the suit of the card.
 */
export function parseCard(card: Card): [Num, Suit] {
    return [card.substring(0, card.length - 1) as Num, card.charAt(card.length - 1) as Suit];
}

export function getPointValue(card: Card) {
    const [num, _] = parseCard(card);
    return num === '5' ? 5 : (num === '10' || num === 'K' ? 10 : 0);
}

/**
 * Compare two cards. Can be used to sort an array of suited cards with arr.sort(compareCards).
 * Considers cards of separate suits to be equal, so make sure the inputs are suited
 * Returns positive if `c1` is larger.
 * @param c1 
 * @param c2 
 * @returns 
 */
export function compareCards(c1: Card, c2: Card, declared?: Card) {
    let [n1, s1] = parseCard(c1);
    let [n2, s2] = parseCard(c2);
    if (declared) {
        const vs1 = getSuit(c1, declared);
        const vs2 = getSuit(c2, declared);
        if (vs1 !== 'T' && vs2 === 'T') {
            return -1;
        } else if (vs1 === 'T' && vs2 !== 'T') {
            return 1;
        } else if (vs1 === 'T' && vs2 === 'T') {
            const [dn, _] = parseCard(declared);
            const i1 = dn === n1 ? NUMS.indexOf('A') + 0.5 : NUMS.indexOf(n1);
            const i2 = dn === n2 ? NUMS.indexOf('A') + 0.5 : NUMS.indexOf(n2);
            return i1 - i2;
        } else {
            return vs1 === vs2 ? NUMS.indexOf(n1) - NUMS.indexOf(n2) : SUITS.indexOf(s1) - SUITS.indexOf(s2);
        }
    }
    return s1 === s2 ? NUMS.indexOf(n1) - NUMS.indexOf(n2) : 0;
}

/**
 * Gets the human-readable name of a card.
 * @param card The card to get the name of.
 * @returns The name of the card.
 */
export function cardName(card: Card) {
    const [num, suit] = parseCard(card);
    return `${NUM_NAMES[num]}${suit !== 'J' || ' of '}${SUIT_NAMES[suit]}`
}

/**
 * Finds the next largest card for the purpose of tractors.
 * 
 * @param card The card which we are finding the next of.
 * @param declared The currently declared card.
 * @param wrap Whether to allow wraparound, e.g. A->2.
 * @returns The next largest card.
 */
export function nextLargest(card: Card, declared: Card, wrap = false): Card | null {
    if (!SETTINGS.wraparound) wrap = false;
    const [num, suit] = parseCard(card);
    const [big, _] = parseCard(declared);

    // condition is long for type pruning
    if (suit === 'J' || num === 'S' || num === 'B') {
        return num === 'B' ? null : 'BJ';
    }
    if (card === declared) {
        return 'SJ';
    }
    if (num === big) {
        return null; // Cannot make tractors from other suits of declared
    }
    if (num === 'A') {
        return wrap ? `${big === '2' ? '3' : '2'}${suit}` : null;
    }
    if (num === 'K' && big === 'A') {
        return null;
    }
    const i = BASIC_NUMS.indexOf(num);
    return `${BASIC_NUMS[i + 1] === big ? BASIC_NUMS[i + 2] : BASIC_NUMS[i + 1]}${suit}`;
}

/**
 * Given a card, gets the card's suit.
 * Unlike getting the last character of the card and `parseCard`,
 * `getSuit` returns `'T'` instead of the card's actual suit if it is trump, depending on `declared`.
 * 
 * @param card `Card` to get the suit of.
 * @param declared The currently declared card.
 * @returns `card`'s suit.
 */
export function getSuit(card: Card, declared: Card) {
    const [num, suit] = parseCard(card);
    const [big, trump] = parseCard(declared);
    return suit === 'J' || suit === trump || num === big ? 'T' : suit;
}
