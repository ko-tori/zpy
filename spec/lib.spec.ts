import { Play } from '../src/Play';
import { Card } from '../src/Card';
import { selectableCards } from '../src/lib';

describe('selectableCards -', () => {
    describe('non-trump trick -', () => {
        const trick = [new Play('QH', 3, 3)];
        const declared = '2C';

        describe('if enough -', () => {
            const hand: Card[] = ['2C', '2C', '3H', '3H', '4H', '4H', '5H', '5H', '5H', '7H', 'KH', 'AH'];
            it('should work without selection', () => {
                expect(selectableCards(hand, [], trick, declared)).toEqual(
                    new Set(['3H', '4H', '5H', '7H', 'KH', 'AH'])
                );
            });
            it('should work with tractor selected first', () => {
                expect(selectableCards(hand, ['3H'], trick, declared)).toEqual(
                    new Set(['3H', '4H', '5H', '7H', 'KH', 'AH'])
                );
                expect(selectableCards(hand, ['3H', '3H'], trick, declared)).toEqual(
                    new Set(['4H', '5H', '7H', 'KH', 'AH'])
                );
                expect(selectableCards(hand, ['3H', '4H'], trick, declared)).toEqual(
                    new Set(['3H', '4H', '5H', '7H', 'KH', 'AH'])
                );
                expect(selectableCards(hand, ['3H', '3H', '4H'], trick, declared)).toEqual(
                    new Set(['4H', '5H', '7H', 'KH', 'AH'])
                );
                expect(selectableCards(hand, ['3H', '3H', '4H', '5H'], trick, declared)).toEqual(
                    new Set(['4H', '5H', '7H', 'KH', 'AH'])
                );
                expect(selectableCards(hand, ['3H', '3H', '4H', '5H', '5H'], trick, declared)).toEqual(
                    new Set(['4H', '5H', '7H', 'KH', 'AH'])
                );
                expect(selectableCards(hand, ['3H', '3H', '4H', '4H', '5H', '5H'], trick, declared)).toEqual(
                    new Set(['5H', '7H', 'KH', 'AH'])
                );
            });
            it('should disable extra single', () => {
                expect(selectableCards(hand, ['3H', '3H', '4H', '4H', '5H', '5H', '7H', 'KH', 'AH'], trick, declared)).toEqual(new Set([]));
                expect(selectableCards(hand, ['3H', '3H', '4H', '4H', '5H', '5H', '5H', 'KH', 'AH'], trick, declared)).toEqual(new Set([]));
            });
        });
        describe('if not enough -', () => {
            const hand: Card[] = ['2C', '2C', '3H', '3H', '4H', '4H', '5H', '5H', '5H', '7H'];
            it('should work without selection', () => {
                expect(selectableCards(hand, ['3H'], trick, declared)).toEqual(
                    new Set(['2C', '3H', '4H', '5H', '7H'])
                );
            });
            it('should work if all suited cards are selected', () => {
                expect(selectableCards(hand, ['3H', '3H', '4H', '4H', '5H', '5H', '5H', '7H'], trick, declared)).toEqual(
                    new Set(['2C'])
                );
            });
            it('should work if enough unsuited cards are selected', () => {
                expect(selectableCards(hand, ['2C'], trick, declared)).toEqual(
                    new Set(['3H', '4H', '5H', '7H'])
                );
            });
        });
    });
});
