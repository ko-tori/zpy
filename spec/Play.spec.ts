import { Play } from '../src/Play';

describe('Play -', () => {
    describe('constructor -', () => {
        it('should fail for m < 1', () => {
            expect(() => new Play('3S', 0)).toThrowError('Cannot have multiplicity < 1.');
        });
        it('should fail for l < 1', () => {
            expect(() => new Play('3S', 2, 0)).toThrowError('Cannot have length < 1.');
        });
        it('should fail for tractors for multiplicity 1', () => {
            expect(() => new Play('3S', 1, 2)).toThrowError('Cannot have tractors of multiplicity 1.');
        });
        it('should serialize nicely', () => {
            const t = new Play('KS');
            expect(JSON.stringify(t)).toBe('{"c":"KS"}');
        });
        it('should serialize nicely with parameters', () => {
            const t = new Play('KS', 2, 3);
            expect(JSON.stringify(t)).toBe('{"c":"KS","m":2,"l":3}');
        });
        it('should remove m and l = 1', () => {
            expect(JSON.stringify(new Play('3S', 1, 1))).toBe('{"c":"3S"}');
        });
    });

    describe('getSuit -', () => {
        it('normal single should not be trump', () => {
            const t = new Play('3S');
            expect(t.getSuit('2C')).toBe('S');
        });
        it('normal tractors should not be trump', () => {
            const t = new Play('3H', 2, 2);
            expect(t.getSuit('2C')).toBe('H');
        });
        it('suited single should be trump', () => {
            const t = new Play('3C');
            expect(t.getSuit('2C')).toBe('T');
        });
        it('suited tractors should be trump', () => {
            const t = new Play('3C', 2, 2);
            expect(t.getSuit('2C')).toBe('T');
        });
        it('declared number should be trump', () => {
            const t = new Play('2S');
            expect(t.getSuit('2C')).toBe('T');
        });
        it('jokers should be trump', () => {
            const t = new Play('SJ');
            const t2 = new Play('BJ');
            expect(t.getSuit('2C')).toBe('T');
            expect(t2.getSuit('2C')).toBe('T');
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
            it('should go from declared card to jokers (A declared)', () => {
                const t = new Play('AS', 2, 3);
                expect(t.getCards('AS')).toEqual(['AS', 'AS', 'SJ', 'SJ', 'BJ', 'BJ']);
            });
            it('should wraparound', () => {
                const t = new Play('AH', 2, 3);
                expect(t.getCards('4S')).toEqual(['AH', 'AH', '2H', '2H', '3H', '3H']);
            });
            it('should wraparound and skip declared card', () => {
                const t = new Play('AH', 2, 3);
                expect(t.getCards('2S')).toEqual(['AH', 'AH', '3H', '3H', '4H', '4H']);
            });
            it('should wraparound with trump', () => {
                const t = new Play('AS', 2, 3);
                expect(t.getCards('4S')).toEqual(['AS', 'AS', '2S', '2S', '3S', '3S']);
            });
            it('should wraparound with trump and skip declared card', () => {
                const t = new Play('AS', 2, 3);
                expect(t.getCards('2S')).toEqual(['AS', 'AS', '3S', '3S', '4S', '4S']);
            });
            it('should fail if out of range', () => {
                const t = new Play('KS', 2, 3);
                expect(() => t.getCards('2C')).toThrowError('Play goes out of range.');
            });
            it('should fail if out of range (A declared, not trump)', () => {
                const t = new Play('KS', 2, 2);
                expect(() => t.getCards('AC')).toThrowError('Play goes out of range.');
            });
            it('should fail if out of range (jokers)', () => {
                const t = new Play('SJ', 2, 3);
                expect(() => t.getCards('2S')).toThrowError('Play goes out of range.');
            });
            it('should fail for non suited trump', () => {
                const t = new Play('2S', 2, 2);
                expect(() => t.getCards('2H')).toThrowError('Play goes out of range.');
            });
        });
    });

    describe('sortPlays -', () => {
        it('should tiebreak by multiplicity', () => {
            const plays = [
                new Play('QC', 3, 3),
                new Play('3C', 2, 2),
                new Play('6C', 2, 3),
                new Play('5C', 1, 1),
                new Play('2C'),
                new Play('9C', 3, 2),
                new Play('10C', 2),
                new Play('JC', 3)
            ];
            expect(Play.sortPlays(plays)).toEqual([
                new Play('2C'),
                new Play('5C'),
                new Play('10C', 2),
                new Play('JC', 3),
                new Play('3C', 2, 2),
                new Play('6C', 2, 3),
                new Play('9C', 3, 2),
                new Play('QC', 3, 3),
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