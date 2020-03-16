// Packages
import * as Rx from 'rxjs';
import Observable from 'zen-observable';

// Ours
import { isStream, isIterable } from './is';

const gen = function*() {};
const asyncGen = async function*() {};
const zenObservable = Observable.of(1, 2);
const rxObservable = Rx.of(1, 2);

test('isIterable', () => {
	expect(isIterable(gen())).toBe(true);
	expect(isIterable(asyncGen())).toBe(true);

	expect(isIterable(gen)).toBe(false);
	expect(isIterable(asyncGen)).toBe(false);
	expect(isIterable(undefined)).toBe(false);
	expect(isIterable({})).toBe(false);
	expect(isIterable(null)).toBe(false);
	expect(isIterable(Promise.resolve())).toBe(false);
});

test('isStream', () => {
	expect(isStream(gen())).toBe(true);
	expect(isStream(asyncGen())).toBe(true);
	expect(isStream(zenObservable)).toBe(true);
	expect(isStream(rxObservable)).toBe(true);

	expect(isStream(gen)).toBe(false);
	expect(isStream(asyncGen)).toBe(false);
	expect(isStream(undefined)).toBe(false);
	expect(isStream({})).toBe(false);
	expect(isStream(null)).toBe(false);
	expect(isStream(Promise.resolve())).toBe(false);
});
