// Ours
import { pipe } from './pipe';
import { $buffer } from './operations';
import { Exchange, ExchangeOptions } from './types';

globalThis.__DEV__ = true;

let options: ExchangeOptions;
beforeEach(() => {
	options = { cache: new Map(), emit: jest.fn() };
});

test('should throw if no exchanges were passesd', () => {
	expect(() => {
		pipe([], options);
	}).toThrow(/at least one exchange/i);

	expect(options.emit).not.toBeCalled();
});

test('should throw if some exchanges are not valid', () => {
	expect(() => {
		pipe([null], options);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([{} as any], options);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([true as any], options);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([{ name: 'test' } as any], options);
	}).toThrow(/exchange.init/i);

	expect(() => {
		pipe([{ name: 'test', init: 'invalid' } as any], options);
	}).toThrow(/exchange.init/i);

	expect(options.emit).not.toBeCalled();
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
		pipe([ex, dup], options);
	}).toThrow(/unique/i);

	expect(options.emit).not.toBeCalled();
	expect(ex.init).not.toBeCalled();
	expect(dup.init).not.toBeCalled();
});

test('should throw when emitting during exchange setup', () => {
	const ex: Exchange = {
		name: 'test',
		init: jest.fn().mockImplementation(({ emit }) => {
			emit(null);
			return (next: any) => (op: any) => next(op);
		}),
	};

	expect(() => {
		pipe([ex], options);
	}).toThrow(/not allowed/i);

	expect(ex.init).toBeCalled();
	expect(options.emit).not.toBeCalled();
});

test('should NOT throw when emitting after exchange setup', () => {
	let called = false;
	const ex: Exchange = {
		name: 'test',
		init: ({ emit }) => next => op => {
			if (!called) {
				called = true;
				emit(null);
			}

			return next(op);
		},
	};

	expect(() => {
		pipe([ex], options)($buffer(null, {}));
	}).not.toThrow();

	expect(options.emit).toBeCalledWith(null);
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

	pipe([a, b, c], options)($buffer(null, '+'));
	expect(options.emit).toBeCalledWith($buffer(null, '+abc'));

	pipe([c, b, a], options)($buffer(null, '+'));
	expect(options.emit).toBeCalledWith($buffer(null, '+cba'));

	pipe([a, c, b], options)($buffer(null, '+'));
	expect(options.emit).toBeCalledWith($buffer(null, '+acb'));
});
