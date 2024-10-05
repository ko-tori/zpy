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


