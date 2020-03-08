// Packages
import { Observer } from 'zen-observable-ts';
import { eventChannel, buffers, END } from 'redux-saga';

// Ours
import { Request } from './utils/request';
import { Stream, Iterable, isIterable } from './utils/is';
import { Event, Response, Failure, Completed } from './utils/events';

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
			next: data => emit(Response(req, data)),
			error: error => emit(Failure(req, error)),
			complete: () => {
				emit(Completed(req));
				emit(END);
			},
		};

		if (isIterable(stream)) {
			iter(stream, observer);
			return () => stream.return?.(null);
		}

		const $ = stream.subscribe(observer);
		return () => $.unsubscribe();
	}, buffers.expanding());
