const RULES = {
    wraparound: true,
};

const SUITS = ['S', 'H', 'D', 'C', 'J'] as const;
type Suit = typeof SUITS[number];
const NUMS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'S', 'B'] as const;
type Num = typeof NUMS[number];

const BASIC_NUMS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
type BasicNum = typeof BASIC_NUMS[number];
const BASIC_SUITS = ['S', 'H', 'D', 'C'] as const;
type BasicSuit = typeof BASIC_SUITS[number];
type Card = `${BasicNum}${BasicSuit}` | 'SJ' | 'BJ';

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

export function parseCard(card: Card): [Num, Suit] {
    return [card.substring(0, card.length - 1) as Num, card.charAt(card.length - 1) as Suit];
}

export function cardName(card: Card) {
    const [num, suit] = parseCard(card);
    return `${NUM_NAMES[num]}${suit !== 'J' || ' of '}${SUIT_NAMES[suit]}`
}

export function selectableCards(hand: Card[], selection: Throw, trick: Throw) {
    const trickCopy = new Set([...trick]);
}

export class Play {
    constructor(private c: Card, private m?: number, private l?: number) {
        if (l && m && l > 1 && m == 1) {
            throw new TypeError('Cannot have tractors of multiplicity 1.')
        }
    }

    isTrump(declaredCard: Card) {
        const [num, suit] = parseCard(this.c);
        const [declaredNum, declaredSuit] = parseCard(declaredCard);
        return suit === 'J' || suit === declaredSuit || num === declaredNum;
    }

    getCards(declaredCard: Card) {
        const [num, suit] = parseCard(this.c);
        const [declaredNum, declaredSuit] = parseCard(declaredCard);
        const cards: Card[] = [];
        let curNum = NUMS.indexOf(num);
        let curSuit = suit;

        if (this.l && this.l > 1 && NUMS[curNum] === declaredNum && curSuit !== declaredSuit) {
            throw new RangeError(`Cannot make tractor from ${NUMS[curNum]}${curSuit}.`);
        }

        for (let i = 0; i < (this.l ?? 1); i++) {
            if (curNum >= NUMS.length) {
                throw new RangeError('Play goes out of range.');
            }
            for (let j = 0; j < (this.m ?? 1); j++) {
                cards.push(`${NUMS[curNum]}${curSuit}` as Card);
            }
            if (`${NUMS[curNum]}${curSuit}` === declaredCard) {
                curNum = NUMS.indexOf('S');
                curSuit = 'J';
            } else if (curNum === NUMS.indexOf('A')) {
                if (curSuit === declaredSuit) {
                    curNum = NUMS.indexOf(declaredNum);
                } else if (i === 0 && RULES.wraparound) {
                    curNum = declaredNum === '2' ? 1 : 0;
                } else if (i != (this.l ?? 1) - 1) {
                    throw new RangeError('Play goes out of range.');
                }
            } else if (NUMS[curNum + 1] === declaredNum) {
                if (curSuit === declaredSuit && NUMS[curNum] === 'K') {
                    curNum++;
                } else if (curNum + 2 >= NUMS.indexOf('S') && i != (this.l ?? 1) - 1) {
                    throw new RangeError('Play goes out of range.');
                } else {
                    curNum += 2;
                }
            } else {
                curNum++;
            }
        }
        return cards;
    }
}

type Throw = Set<Play>;