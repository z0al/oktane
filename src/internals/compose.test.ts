// Ours
import { compose } from './compose';

globalThis.__DEV__ = true;

let emit: any;

beforeEach(() => {
	emit = jest.fn();
});

test('should throw if no exchanges were passesd', () => {
	expect(() => {
		compose([], emit);
	}).toThrow(/at least one exchange/i);

	expect(emit).not.toBeCalled();
});

test('should throw if some exchanges are not functions', () => {
	expect(() => {
		compose([null], emit);
	}).toThrow(/must be a function/i);

	expect(() => {
		compose([{} as any], emit);
	}).toThrow(/must be a function/i);

	expect(() => {
		compose([true as any], emit);
	}).toThrow(/must be a function/i);

	expect(emit).not.toBeCalled();
});

test('should throw when emitting during exchange setup', () => {
	const ex = jest.fn().mockImplementation(({ emit }) => emit());

	expect(() => {
		compose([ex], emit);
	}).toThrow(/not allowed/i);

	expect(ex).toBeCalled();
	expect(emit).not.toBeCalled();
});

test('should reduce exchanges from left to right', () => {
	// We don't support strings as "Operation" but that's out of the
	// scope of `compose`.
	// @ts-ignore
	const a = () => next => op => next(op + 'a');
	// @ts-ignore
	const b = () => next => op => next(op + 'b');
	// @ts-ignore
	const c = () => next => op => next(op + 'c');

	// @ts-ignore
	const emit = o => o;

	expect(compose([a, b, c], emit)('+' as any)).toEqual('+cba');
	expect(compose([c, b, a], emit)('+' as any)).toEqual('+abc');

	expect(compose([a, a, b], emit)('+' as any)).toEqual('+baa');
});
