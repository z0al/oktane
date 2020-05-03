// Ours
import { $ } from '../utils/operations';
import { pipe, Plugin } from './api';

// @ts-ignore
global.__DEV__ = true;

let cache: any, emit: any;

beforeEach(() => {
	cache = new Map();
	emit = jest.fn();
});

test('should throw if some plugins are not valid', () => {
	expect(() => {
		pipe([null], emit, cache);
	}).toThrow(/plugin.name/i);

	expect(() => {
		pipe([{} as any], emit, cache);
	}).toThrow(/plugin.name/i);

	expect(() => {
		pipe([true as any], emit, cache);
	}).toThrow(/plugin.name/i);

	expect(() => {
		pipe([{ name: 'test' } as any], emit, cache);
	}).toThrow(/plugin.init/i);

	expect(() => {
		pipe([{ name: 'test', init: 'invalid' } as any], emit, cache);
	}).toThrow(/plugin.init/i);

	expect(emit).not.toBeCalled();
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
		pipe([ex, dup], emit, cache);
	}).toThrow(/unique/i);

	expect(emit).not.toBeCalled();
	expect(ex.init).not.toBeCalled();
	expect(dup.init).not.toBeCalled();
});

test('should throw when emitting during plugin setup', () => {
	const ex: Plugin = {
		name: 'test',
		init: jest.fn().mockImplementation(({ apply }) => {
			apply();
			return (next: any) => (op: any) => next(op);
		}),
	};

	expect(() => {
		pipe([ex], emit, cache);
	}).toThrow(/not allowed/i);

	expect(ex.init).toBeCalled();
	expect(emit).not.toBeCalled();
});

test('should throw when trying to dispose a request', () => {
	const ex: Plugin = {
		name: 'test',
		init: jest
			.fn()
			.mockImplementation(({ apply }) => (next: any) => (op: any) => {
				apply('dispose', { request: null });
				next(op);
			}),
	};

	expect(() => {
		pipe([ex], emit, cache)(null);
	}).toThrow(/disposal/i);

	expect(ex.init).toBeCalled();
	expect(emit).not.toBeCalled();
});

test('should compose plugins from right to left', () => {
	const createplugin = (name: string): Plugin => ({
		name,
		init: () => (next) => (op) =>
			next($('put', { request: null, data: op.payload.data + name })),
	});

	const a = createplugin('a');
	const b = createplugin('b');
	const c = createplugin('c');

	pipe([a, b, c], emit, cache)($('put', { request: null, data: '+' }));
	expect(emit).toBeCalledWith(
		$('put', { request: null, data: '+abc' })
	);

	pipe([c, b, a], emit, cache)($('put', { request: null, data: '+' }));
	expect(emit).toBeCalledWith(
		$('put', { request: null, data: '+cba' })
	);

	pipe([a, c, b], emit, cache)($('put', { request: null, data: '+' }));
	expect(emit).toBeCalledWith(
		$('put', { request: null, data: '+acb' })
	);
});
