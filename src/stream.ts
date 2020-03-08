// Packages
import { Observer } from 'zen-observable-ts';
import { eventChannel, buffers, END } from 'redux-saga';

// Ours
import { Event } from './utils/events';
import { Request } from './utils/request';
import { Stream, Iterable, isIterable } from './utils/is';

const iter = async (g: Iterable, o: Observer<any>) => {
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
		const observer: Observer<any> = {
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

		if (isIterable(stream)) {
			iter(stream, observer);
			return () => stream.return?.(null);
		}

		const $ = stream.subscribe(observer);
		return () => $.unsubscribe();
	}, buffers.expanding());
