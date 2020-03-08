// Packages
// @ts-ignore
import isObservable from 'is-observable';
import { eventChannel, END, buffers } from 'redux-saga';
import { Observable, Observer } from 'zen-observable-ts';

// Ours
import { Event } from './utils/events';
import { Request } from './utils/request';

type AnyGenerator = Generator<any> | AsyncGenerator<any>;
export type Stream = AnyGenerator | Observable<any>;

const isFunc = (f: any) => typeof f === 'function';

const isGenerator = (g: any): g is AnyGenerator =>
	g && isFunc(g.next) && isFunc(g.throw);

export const isStream = (s: any): s is Stream =>
	isGenerator(s) || isObservable(s);

const iter = async (g: AnyGenerator, o: Observer<any>) => {
	try {
		for await (const value of g) {
			o.next(value);
		}
	} catch (error) {
		return o.error(error);
	}

	return o.complete();
};

export const streamChannel = (stream: Stream, req: Request) =>
	eventChannel<Event>(emit => {
		const subscriber: Observer<unknown> = {
			next: data =>
				emit({
					type: '@data',
					payload: { res: { request: req, data } },
				}),
			error: error =>
				emit({
					type: '@failed',
					payload: { error, req },
				}),
			complete: () => emit(END),
		};

		if (isGenerator(stream)) {
			iter(stream, subscriber);
			return () => stream.return(null);
		}

		const sub = stream.subscribe(subscriber);
		return () => sub.unsubscribe();
	}, buffers.expanding());
