import { cn } from '@/lib/utils';

describe('cn function', () => {
  describe('basic class merging', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle single class name', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('should handle multiple class names', () => {
      expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
    });
  });

  describe('conditional classes', () => {
    it('should include classes when condition is true', () => {
      expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
    });

    it('should exclude classes when condition is false', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle null and undefined values', () => {
      expect(cn('foo', null, 'bar', undefined, 'baz')).toBe('foo bar baz');
    });

    it('should handle multiple conditional classes', () => {
      expect(
        cn('base', true && 'cond1', false && 'cond2', true && 'cond3')
      ).toBe('base cond1 cond3');
    });
  });

  describe('Tailwind conflict resolution', () => {
    it('should resolve Tailwind class conflicts - padding x', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should resolve Tailwind class conflicts - margin', () => {
      expect(cn('m-2', 'm-4')).toBe('m-4');
    });

    it('should resolve Tailwind class conflicts - text size', () => {
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    });

    it('should resolve multiple Tailwind conflicts', () => {
      expect(cn('px-2 py-4 text-sm', 'px-6 py-8 text-lg')).toBe(
        'px-6 py-8 text-lg'
      );
    });

    it('should keep non-conflicting Tailwind classes', () => {
      expect(cn('px-2', 'py-4', 'text-sm')).toBe('px-2 py-4 text-sm');
    });

    it('should handle responsive variants', () => {
      // tailwind-merge preserves responsive variant order
      expect(cn('px-2 md:px-4', 'px-6')).toBe('md:px-4 px-6');
    });
  });

  describe('arrays and objects', () => {
    it('should handle array of class names', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle object with boolean values', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle combination of arrays and objects', () => {
      expect(cn(['foo', 'bar'], { baz: true, qux: false })).toBe(
        'foo bar baz'
      );
    });

    it('should handle nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
    });

    it('should handle complex mixed inputs', () => {
      expect(
        cn(
          'base-class',
          ['array-1', 'array-2'],
          { obj1: true, obj2: false },
          false && 'ignored',
          'another-class'
        )
      ).toBe('base-class array-1 array-2 obj1 another-class');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('should handle numbers (converted to strings)', () => {
      expect(cn('class', 0, 'another')).toBe('class another');
    });

    it('should handle duplicate class names', () => {
      // clsx doesn't deduplicate non-Tailwind class names
      expect(cn('foo', 'bar', 'foo')).toBe('foo bar foo');
    });

    it('should handle Tailwind arbitrary values', () => {
      expect(cn('px-[10px]', 'px-[20px]')).toBe('px-[20px]');
    });

    it('should handle complex Tailwind combinations', () => {
      expect(cn('hover:px-2 px-4', 'px-6')).toBe('hover:px-2 px-6');
    });
  });
});
