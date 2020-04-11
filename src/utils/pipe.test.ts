// Ours
import { pipe } from './pipe';
import { $buffer } from './operations';
import { Exchange, ExchangeAPI } from './types';

let api: ExchangeAPI;
beforeEach(() => {
	api = { cache: new Map(), emit: jest.fn() };
});

test('should throw if no exchanges were passesd', () => {
	expect(() => {
		pipe([], api);
	}).toThrow(/at least one exchange/i);

	expect(api.emit).not.toBeCalled();
});

test('should throw if some exchanges are not valid', () => {
	expect(() => {
		pipe([null], api);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([{} as any], api);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([true as any], api);
	}).toThrow(/exchange.name/i);

	expect(() => {
		pipe([{ name: 'test' } as any], api);
	}).toThrow(/exchange.init/i);

	expect(() => {
		pipe([{ name: 'test', init: 'invalid' } as any], api);
	}).toThrow(/exchange.init/i);

	expect(api.emit).not.toBeCalled();
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
		pipe([ex, dup], api);
	}).toThrow(/unique/i);

	expect(api.emit).not.toBeCalled();
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
		pipe([ex], api);
	}).toThrow(/not allowed/i);

	expect(ex.init).toBeCalled();
	expect(api.emit).not.toBeCalled();
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
		pipe([ex], api)($buffer(null, {}));
	}).not.toThrow();

	expect(api.emit).toBeCalledWith(null);
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

	pipe([a, b, c], api)($buffer(null, '+'));
	expect(api.emit).toBeCalledWith($buffer(null, '+abc'));

	pipe([c, b, a], api)($buffer(null, '+'));
	expect(api.emit).toBeCalledWith($buffer(null, '+cba'));

	pipe([a, c, b], api)($buffer(null, '+'));
	expect(api.emit).toBeCalledWith($buffer(null, '+acb'));
});
