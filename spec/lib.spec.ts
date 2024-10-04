import { computeNeeds } from '../src/lib';
import { Play } from '../src/Play';
import { Card } from '../src/Card';

describe('selectableCards -', () => {
    describe('non-trump trick -', () => {
        const trick = [new Play('QH', 3, 3)];
        const declared = '2C';

        describe('if enough -', () => {
            const hand: Card[] = ['2C', '2C', '3H', '3H', '4H', '4H', '5H', '5H', '5H', '7H', 'KH', 'AH'];
            it('should work without selection', () => {
                // expect(selectableCards(hand, [], trick, declared)).toEqual(
                //     ['3H', '3H', '4H', '4H', '5H', '5H', '5H', '7H', 'KH', 'AH']
                // );
            });

        });
    });
});

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

