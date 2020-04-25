const func = (f: unknown): f is Function => typeof f === 'function';

const string = (s: unknown): s is string => typeof s === 'string';

const promise = <T>(p: unknown): p is Promise<T> =>
	toString.call(p) === '[object Promise]';

const nullish = (v: unknown): v is null =>
	v === undefined || v === null;

const iterable = (t: any): t is Iterable<any> | AsyncIterable<any> =>
	func(t?.[Symbol.iterator]) || func(t?.[Symbol.asyncIterator]);

export default {
	func,
	string,
	promise,
	nullish,
	iterable,
};
