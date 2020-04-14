// Packages
import plainObject from 'is-plain-obj';

// @ts-ignore
import observable from 'is-observable';

const func = (f: unknown): f is Function => typeof f === 'function';

const string = (s: unknown): s is string => typeof s === 'string';

const promise = <T>(p: unknown): p is Promise<T> =>
	toString.call(p) === '[object Promise]';

const nullish = (v: unknown): v is null =>
	v === undefined || v === null;

const generator = <T>(g: any): g is Generator<T> | AsyncGenerator<T> =>
	(func(g?.[Symbol.iterator]) || func(g?.[Symbol.asyncIterator])) &&
	func(g?.next) &&
	func(g?.throw);

export default {
	plainObject,
	observable,
	func,
	string,
	promise,
	nullish,
	generator,
};
