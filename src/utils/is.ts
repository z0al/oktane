// Packages
import isObservable from 'is-observable';
import { Observable } from 'zen-observable-ts';

export type Iterable = Generator<any> | AsyncGenerator<any>;
export type Stream = Iterable | Observable<any>;

export const isFunc = (f: any) => typeof f === 'function';

export const isIterable = (g: any): g is Iterable =>
	Boolean(g && isFunc(g.next) && isFunc(g.return));

export const isStream = (s: any): s is Stream =>
	isIterable(s) || isObservable(s);
