import { describe, it, expect } from 'vitest';
import { formatFloatValue } from './formatting';

describe('formatFloatValue', () => {
    it('should format a float to 1 decimal place by default', () => {
        expect(formatFloatValue(26.103811264038087)).toBe('26.1');
    });

    it('should format an integer without trailing ".0"', () => {
        expect(formatFloatValue(878)).toBe('878');
    });

    it('should format zero without trailing ".0"', () => {
        expect(formatFloatValue(0)).toBe('0');
    });

    it('should format with custom decimalPlaces', () => {
        expect(formatFloatValue(51.19014882817757, 2)).toBe('51.19');
    });

    it('should round up correctly', () => {
        expect(formatFloatValue(26.19, 1)).toBe('26.2');
    });

    it('should handle NaN', () => {
        expect(formatFloatValue(NaN)).toBe('NaN');
    });

    it('should handle Infinity', () => {
        expect(formatFloatValue(Infinity)).toBe('Infinity');
    });

    it('should handle -Infinity', () => {
        expect(formatFloatValue(-Infinity)).toBe('-Infinity');
    });

    it('should handle negative numbers with 1 decimal', () => {
        expect(formatFloatValue(-5.37, 1)).toBe('-5.4');
    });

    it('should handle small fractional numbers', () => {
        expect(formatFloatValue(0.001, 2)).toBe('0');
    });

    it('should handle very large numbers', () => {
        expect(formatFloatValue(123456789.123456789, 3)).toBe('123456789.123');
    });

    it('should handle 5 decimal places rounding', () => {
        expect(formatFloatValue(0.00005, 4)).toBe('0.0001');
    });
});
