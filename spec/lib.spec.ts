import "jasmine";

import { Play } from '../src/lib'

describe('Play -', () => {

    describe('isTrump -', () => {
        it('normal single should not be trump', () => {
            const t = new Play('3S');
            expect(t.isTrump('2C')).toBe(false);
        });
        it('normal tractors should not be trump', () => {
            const t = new Play('3S', 2, 2);
            expect(t.isTrump('2C')).toBe(false);
        });
        it('suited single should be trump', () => {
            const t = new Play('3C');
            expect(t.isTrump('2C')).toBe(true);
        });
        it('suited tractors should be trump', () => {
            const t = new Play('3C', 2, 2);
            expect(t.isTrump('2C')).toBe(true);
        });
        it('declared number should be trump', () => {
            const t = new Play('2S');
            expect(t.isTrump('2C')).toBe(true);
        });
        it('jokers should be trump', () => {
            const t = new Play('SJ');
            const t2 = new Play('BJ');
            expect(t.isTrump('2C')).toBe(true);
            expect(t2.isTrump('2C')).toBe(true);
        });
    });

    describe('getCards -', () => {
        it('should work on a single card', () => {
            const t = new Play('2S');
            expect(t.getCards('2S')).toEqual(['2S']);
        });
        it('should work on a pair', () => {
            const t = new Play('2S', 2);
            expect(t.getCards('2S')).toEqual(['2S', '2S']);
        });
        describe('Tractors -', () => {
            it('should work', () => {
                const t = new Play('2S', 2, 2);
                expect(t.getCards('4C')).toEqual(['2S', '2S', '3S', '3S']);
            });
            it('should allow ending in A', () => {
                const t = new Play('QS', 2, 3);
                expect(t.getCards('2C')).toEqual(['QS', 'QS', 'KS', 'KS', 'AS', 'AS']);
            });
            it('should work for high multiplicity', () => {
                const t = new Play('2S', 4, 4);
                expect(t.getCards('6C')).toEqual(['2S', '2S', '2S', '2S', '3S', '3S', '3S', '3S', '4S', '4S', '4S', '4S', '5S', '5S', '5S', '5S',]);
            });
            it('should skip declared card', () => {
                const t = new Play('2S', 2, 2);
                expect(t.getCards('3S')).toEqual(['2S', '2S', '4S', '4S']);
            });
            it('should work on jokers', () => {
                const t = new Play('SJ', 2, 2);
                expect(t.getCards('2S')).toEqual(['SJ', 'SJ', 'BJ', 'BJ']);
            });
            it('should go from declared card to jokers', () => {
                const t = new Play('2S', 2, 3);
                expect(t.getCards('2S')).toEqual(['2S', '2S', 'SJ', 'SJ', 'BJ', 'BJ']);
            });
            it('should go through declared card to jokers', () => {
                const t = new Play('AS', 2, 4);
                expect(t.getCards('2S')).toEqual(['AS', 'AS', '2S', '2S', 'SJ', 'SJ', 'BJ', 'BJ']);
            });
            it('should go through declared card to jokers (A declared)', () => {
                const t = new Play('KS', 2, 4);
                expect(t.getCards('AS')).toEqual(['KS', 'KS', 'AS', 'AS', 'SJ', 'SJ', 'BJ', 'BJ']);
            });
            it('should wraparound', () => {
                const t = new Play('AH', 2, 3);
                expect(t.getCards('4S')).toEqual(['AH', 'AH', '2H', '2H', '3H', '3H']);
            });
            it('should wraparound and skip declared card', () => {
                const t = new Play('AH', 2, 3);
                expect(t.getCards('2S')).toEqual(['AH', 'AH', '3H', '3H', '4H', '4H']);
            });
            it('should fail if out of range', () => {
                const t = new Play('KS', 2, 3);
                expect(() => t.getCards('2C')).toThrow(new RangeError('Play goes out of range.'))
            });
            it('should fail if out of range (A declared, not trump)', () => {
                const t = new Play('KS', 2, 2);
                expect(() => t.getCards('AC')).toThrow(new RangeError('Play goes out of range.'))
            });
            it('should fail if out of range (jokers)', () => {
                const t = new Play('SJ', 2, 3);
                expect(() => t.getCards('2S')).toThrow(new RangeError('Play goes out of range.'))
            });
            it('should fail for non suited trump', () => {
                const t = new Play('2S', 2, 2);
                expect(() => t.getCards('2H')).toThrow(new RangeError('Cannot make tractor from 2S.'))
            })
        });
    });

    it('should serialize nicely', () => {
        const t = new Play('KS');
        expect(JSON.stringify(t)).toBe('{"c":"KS"}');
    });
    it('should serialize nicely with multiplicity', () => {
        const t = new Play('KS', 2, 3);
        expect(JSON.stringify(t)).toBe('{"c":"KS","m":2,"l":3}');
    });
})