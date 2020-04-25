// Ours
import { $put } from './operations';
import { pipe, Plugin, PluginOptions } from './plugins';

let api: PluginOptions;
beforeEach(() => {
	api = { cache: new Map(), emit: jest.fn() };
});

test('should throw if no plugins were passesd', () => {
	expect(() => {
		pipe([], api);
	}).toThrow(/at least one plugin/i);

	expect(api.emit).not.toBeCalled();
});

test('should throw if some plugins are not valid', () => {
	expect(() => {
		pipe([null], api);
	}).toThrow(/plugin.name/i);

	expect(() => {
		pipe([{} as any], api);
	}).toThrow(/plugin.name/i);

	expect(() => {
		pipe([true as any], api);
	}).toThrow(/plugin.name/i);

	expect(() => {
		pipe([{ name: 'test' } as any], api);
	}).toThrow(/plugin.init/i);

	expect(() => {
		pipe([{ name: 'test', init: 'invalid' } as any], api);
	}).toThrow(/plugin.init/i);

	expect(api.emit).not.toBeCalled();
});

test('should throw if plugin names are not unique', () => {
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

test('should throw when emitting during plugin setup', () => {
	const ex: Plugin = {
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

test('should NOT throw when emitting after plugin setup', () => {
	let called = false;
	const ex: Plugin = {
		name: 'test',
		init: ({ emit }) => (next) => (op) => {
			if (!called) {
				called = true;
				emit(null);
			}

			return next(op);
		},
	};

	expect(() => {
		pipe([ex], api)($put(null, {}));
	}).not.toThrow();

	expect(api.emit).toBeCalledWith(null);
});

test('should compose plugins from right to left', () => {
	const createplugin = (name: string): Plugin => ({
		name,
		init: () => (next) => (op) =>
			next($put(null, (op.payload as any).data + name)),
	});

	const a = createplugin('a');
	const b = createplugin('b');
	const c = createplugin('c');

	pipe([a, b, c], api)($put(null, '+'));
	expect(api.emit).toBeCalledWith($put(null, '+abc'));

	pipe([c, b, a], api)($put(null, '+'));
	expect(api.emit).toBeCalledWith($put(null, '+cba'));

	pipe([a, c, b], api)($put(null, '+'));
	expect(api.emit).toBeCalledWith($put(null, '+acb'));
});
