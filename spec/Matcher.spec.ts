import { computeNeeds, Matcher } from '../src/Matcher';
import { Play } from '../src/Play';
import { createSuitedHand } from './util';

describe('computeNeeds', () => {
    it('should work 3, 3, 2, 2', () => {
        expect(computeNeeds(3, 3, 2, 2)).toEqual([[3, 1], [1, 1], [1, 1]]);
    });
    it('should work 4, 4, 2, 2', () => {
        expect(computeNeeds(4, 4, 2, 2)).toEqual([[4, 2], [2, 2]]);
    });
    it('should work 4, 2, 2, 2', () => {
        expect(computeNeeds(4, 2, 2, 2)).toEqual([[2, 2]]);
    });
    it('should work 2, 4, 2, 2', () => {
        expect(computeNeeds(2, 4, 2, 2)).toEqual([[2, 2]]);
    });
});

describe('getPossibilities', () => {
    it('should work (3x1, 2x1)', () => {
        const m = Matcher.fromHand(createSuitedHand('33455'), [new Play('10C', 3, 1)], '2S');
        expect(m.getPossibilities()).toEqual([
            [{ m: 2, l: 1 }, { m: 1, l: 1 }]
        ]);
    });
    it('should work (3+1+1, 2x1)', () => {
        const m = Matcher.fromHand(createSuitedHand('33456'), [new Play('AC', 3, 1), new Play('KC', 1, 1), new Play('QC', 1, 1)], '2S');
        expect(m.getPossibilities()).toEqual([
            [{ m: 2, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }]
        ]);
    });
    it('should work (3x3, 3x2)', () => {
        const m = Matcher.fromHand(createSuitedHand('3344445555777888KA', 'H'), [new Play('10H', 3, 3)], '2C');
        expect(m.getPossibilities()).toEqual([
            [new Play('4H', 3, 2), new Play('7H', 3)],
            [new Play('4H', 3, 2), new Play('8H', 3)],
            [new Play('7H', 3, 2), new Play('4H', 3)],
            [new Play('7H', 3, 2), new Play('5H', 3)]
        ]);
    });
    it('should work (3x3, 2x3)', () => {
        const m = Matcher.fromHand(createSuitedHand('3344455777'), [new Play('10C', 3, 3)], '2S');
        expect(m.getPossibilities()).toEqual([
            [new Play('3C', 2, 3), { m: 1, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }]
        ]);
    });
    it('force playing less groups (3x3, 2x2 + 3x1)', () => {
        const m = Matcher.fromHand(createSuitedHand('33446677799'), [new Play('10C', 3, 3)], '2S');
        expect(m.getPossibilities()).toEqual([
            [new Play('3C', 2, 2), new Play('7C', 3, 1), { m: 1, l: 1 }, { m: 1, l: 1 }]
        ]);
    });
    it('do not allow breaking smaller group with larger group choice', () => {
        const m = Matcher.fromHand(createSuitedHand('334444466666'), [new Play('9C', 5), new Play('JC', 2, 2)], '2S');
        expect(m.getPossibilities()).toEqual([
            [new Play('6C', 5), new Play('3C', 2, 2)]
        ]);
    });
    it('complex example', () => {
        const m = Matcher.fromHand(createSuitedHand('3344455556777899TT'), [new Play('JC', 4, 4)], '2S');
        expect(m.getPossibilities()).toEqual([
            [new Play('4C', 3, 2), new Play('9C', 2, 2), { m: 2, l: 1 }, { m: 2, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }]
        ]);
    });
    it('complex example 2', () => {
        const m = Matcher.fromHand(createSuitedHand('33444555567899TT'), [new Play('JC', 4, 4)], '2S');
        expect(m.getPossibilities()).toEqual([
            [new Play('4C', 3, 2), new Play('9C', 2, 2), { m: 2, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }],
        ]);
    });
    it('wraparound tractor', () => {
        const m = Matcher.fromHand(createSuitedHand('AA22'), [new Play('KS', 2, 2)], '3S');
        expect(m.getPossibilities()).toEqual([[new Play('AC', 2, 2)]]);
    });
    it('skip tractor', () => {
        const m = Matcher.fromHand(createSuitedHand('2244'), [new Play('KS', 2, 2)], '3S');
        expect(m.getPossibilities()).toEqual([[new Play('2C', 2, 2)]]);
    });
    it('skip wraparound tractor', () => {
        const m = Matcher.fromHand(createSuitedHand('AA33'), [new Play('KS', 2, 2)], '2S');
        expect(m.getPossibilities()).toEqual([[new Play('AC', 2, 2)]]);
    });
    it('trump tractors', () => {
        const m = Matcher.fromHand(createSuitedHand('4467'), [new Play('2S', 2, 2)], '2S');
        expect(m.getPossibilities()).toEqual([[{ m: 2, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }]]);
    });
    it('trump tractors 3x3', () => {
        const m = Matcher.fromHand(['2S', '2S', '2S', 'SJ', 'SJ', 'SJ', 'BJ', 'BJ', 'BJ'], [new Play('3S', 3, 3)], '2S');
        expect(m.getPossibilities()).toEqual([[new Play('2S', 3, 3)]]);
    });
    it('trump tractors 3x3, 2x3', () => {
        const m = Matcher.fromHand(['7S', '6S', '6S', '2S', '2S', 'SJ', 'SJ', 'BJ', 'BJ'], [new Play('3S', 3, 3)], '2S');
        expect(m.getPossibilities()).toEqual([[new Play('2S', 2, 3), { m: 1, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }]]);
    });
    it('trump tractors 3x3, 3x2', () => {
        const m = Matcher.fromHand(['7S', '6S', '6S', 'SJ', 'SJ', 'SJ', 'BJ', 'BJ', 'BJ'], [new Play('3S', 3, 3)], '2S');
        expect(m.getPossibilities()).toEqual([[new Play('SJ', 3, 2), { m: 2, l: 1 }, { m: 1, l: 1 }]]);
    });
    describe('initial throw -', () => {
        it('should work if throw size is a multiple of the number of decks', () => {
            const m = Matcher.initialThrow(['7S', '6S', '6S', 'SJ', 'SJ', 'SJ', 'BJ', 'BJ', 'BJ'], 3, '2S');
            expect(m.getPossibilities()).toEqual([[new Play('SJ', 3, 2), new Play('6S', 2), new Play('7S')]]);
        });
        it('should work if throw size is not a multiple of the number of decks', () => {
            const m = Matcher.initialThrow(['5S', '7S', '6S', '6S', 'SJ', 'SJ', 'SJ', 'BJ', 'BJ', 'BJ'], 3, '2S');
            expect(m.getPossibilities()).toEqual([[new Play('SJ', 3, 2), new Play('6S', 2), new Play('7S'), new Play('5S')]]);
        });
        it('another example', () => {
            const m = Matcher.initialThrow(['6S', '7S', '6S', '6S', 'SJ', 'SJ', 'SJ', 'BJ', 'BJ', 'BJ'], 3, '2S');
            expect(m.getPossibilities()).toEqual([[new Play('SJ', 3, 2), new Play('6S', 3), new Play('7S')]]);
        });
        it('big example', () => {
            const m = Matcher.initialThrow(createSuitedHand('33334445556778999TTJQKKKAAAA'), 4, '2S');
            expect(m.getPossibilities()).toEqual([
                [
                    new Play('3C', 3, 3),
                    new Play('KC', 3, 2),
                    new Play('9C', 2, 2),
                    new Play('7C', 2),
                    new Play('AC'),
                    new Play('QC'),
                    new Play('JC'),
                    new Play('9C'),
                    new Play('8C'),
                    new Play('6C'),
                    new Play('3C')
                ]
            ]);
        });
    });

    describe('winsAgainst -', () => {
        it('should work with mismatched response', () => {
            expect(Play.winsAgainst([new Play('4C', 2), new Play('5C', 1)], [new Play('AC', 1), new Play('KC', 1), new Play('4C', 1)], '2S')).toBe(true);
        });
        it('should work with partially off suit response', () => {
            expect(Play.winsAgainst([new Play('4C', 2), new Play('5C', 1)], [new Play('3C', 2), new Play('4H', 1)], '2S')).toBe(true);
        });
        it('should work with fully off suit response', () => {
            expect(Play.winsAgainst([new Play('2C', 2), new Play('3C', 1)], [new Play('6H', 1), new Play('5H', 1), new Play('4H', 1)], '2S')).toBe(true);
        });
        it('should work with matching but lower response', () => {
            expect(Play.winsAgainst([new Play('AC', 2), new Play('KC', 1)], [new Play('3C', 2), new Play('4C', 1)], '2S')).toBe(true);
        });
        it('should work with matching and higher response', () => {
            expect(Play.winsAgainst([new Play('3C', 2, 2)], [new Play('KC', 2, 2)], '2S')).toBe(false);
        });
        it('should work with trump response', () => {
            expect(Play.winsAgainst([new Play('AC', 2), new Play('KC', 1)], [new Play('3S', 2), new Play('SJ', 1)], '2S')).toBe(false);
        });
        it('should work trump vs trump', () => {
            expect(Play.winsAgainst([new Play('AS', 2)], [new Play('2C', 2)], '2S')).toBe(false);
            expect(Play.winsAgainst([new Play('2S', 2)], [new Play('SJ', 2)], '2S')).toBe(false);
            expect(Play.winsAgainst([new Play('2H', 2)], [new Play('SJ', 2)], '2S')).toBe(false);
            expect(Play.winsAgainst([new Play('2H', 2)], [new Play('3S', 2)], '2S')).toBe(true);
            expect(Play.winsAgainst([new Play('BJ', 2)], [new Play('SJ', 2)], '2S')).toBe(true);
        });
    });
});