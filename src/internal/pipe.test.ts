// Ours
import { pipe } from './pipe';
import { $buffer } from './operations';
import { Exchange, EmitFunc } from './types';

globalThis.__DEV__ = true;

let emit: EmitFunc;
beforeEach(() => {
	emit = jest.fn();
});

test('should throw if no exchanges were passesd', () => {
	expect(() => {
		pipe([], emit);
	}).toThrow(/at least one exchange/i);

	expect(emit).not.toBeCalled();
});

test('should throw if some exchanges are not valid', () => {
	expect(() => {
		pipe([null], emit);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([{} as any], emit);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([true as any], emit);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([{ name: 'test' } as any], emit);
	}).toThrow(/exchange.init/i);

	expect(() => {
		pipe([{ name: 'test', init: 'invalid' } as any], emit);
	}).toThrow(/exchange.init/i);

	expect(emit).not.toBeCalled();
});

test('should throw if exchange names are not unique', () => {
	const ex = {
		name: 'ex',
		init: jest.fn(),
	};

	const dup = {
		name: 'ex',
		init: jest.fn(),
	};

	expect(() => {
		pipe([ex, dup], emit);
	}).toThrow(/unique/i);

	expect(emit).not.toBeCalled();
	expect(ex.init).not.toBeCalled();
	expect(dup.init).not.toBeCalled();
});

test('should throw when emitting during exchange setup', () => {
	const ex = {
		name: 'test',
		init: jest.fn().mockImplementation(({ emit }) => emit()),
	};

	expect(() => {
		pipe([ex], emit);
	}).toThrow(/not allowed/i);

	expect(ex.init).toBeCalled();
	expect(emit).not.toBeCalled();
});

test('should compose exchanges from right to left', () => {
	const createExchange = (name: string): Exchange => ({
		name,
		init: () => next => op =>
			next($buffer(null, (op.payload as any).data + name)),
	});

	const a = createExchange('a');
	const b = createExchange('b');
	const c = createExchange('c');
	emit = o => o;

	expect(pipe([a, b, c], emit)($buffer(null, '+'))).toEqual(
		$buffer(null, '+abc')
	);
	expect(pipe([c, b, a], emit)($buffer(null, '+'))).toEqual(
		$buffer(null, '+cba')
	);
	expect(pipe([a, c, b], emit)($buffer(null, '+'))).toEqual(
		$buffer(null, '+acb')
	);
});
