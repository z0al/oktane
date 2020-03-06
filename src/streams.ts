// Packages
const isObservable = require('is-observable');
import { eventChannel, END } from 'redux-saga';
import { Observable, Observer } from 'zen-observable-ts';

// Ours
import { Event } from './utils/events';
import { Request } from './utils/request';

type AnyGenerator = Generator<any> | AsyncGenerator<any>;
export type Streamable = AnyGenerator | Observable<any>;

const isFunc = (f: any) => typeof f === 'function';

const isGenerator = (g: any): g is AnyGenerator =>
	g && isFunc(g.next) && isFunc(g.throw);

export const isStreamable = (s: any): s is Streamable =>
	isGenerator(s) || isObservable(s);

export const streamChannel = (stream: Streamable, req: Request) =>
	eventChannel<Event>(emit => {
		const observer: Observer<unknown> = {
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
			const timeout = setTimeout(async () => {
				try {
					for await (let value of stream) {
						observer.next(value);
					}
				} catch (error) {
					return observer.error(error);
				}

				return observer.complete();
			});

			return () => clearTimeout(timeout);
		}

		const sub = stream.subscribe(observer);
		return () => sub.unsubscribe();
	});
