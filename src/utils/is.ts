const func = (f: unknown): f is Function => typeof f === 'function';

const string = (s: unknown): s is string => typeof s === 'string';

const promise = <T>(p: unknown): p is Promise<T> =>
	toString.call(p) === '[object Promise]';

const nullish = (v: unknown): v is null =>
	v === undefined || v === null;

const iterator = (
	t: any
): t is IterableIterator<any> | AsyncIterableIterator<any> =>
	typeof t === 'object' &&
	(func(t[Symbol.iterator]) || func(t[Symbol.asyncIterator])) &&
	func(t.next);

export default {
	func,
	string,
	promise,
	nullish,
	iterator,
};
