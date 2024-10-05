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
            [new Play('3C', 2, 1), { m: 1, l: 1 }],
            [new Play('5C', 2, 1), { m: 1, l: 1 }]
        ]);
    });
    it('should work (3+1+1, 2x1)', () => {
        const m = Matcher.fromHand(createSuitedHand('33456'), [new Play('AC', 3, 1), new Play('KC', 1, 1), new Play('QC', 1, 1)], '2S');
        expect(m.getPossibilities()).toEqual([
            [new Play('3C', 2, 1), { m: 1, l: 1 }, { m: 1, l: 1 }, { m: 1, l: 1 }]
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
    })
});