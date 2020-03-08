// Packages
import { Observer } from 'zen-observable-ts';
import { eventChannel, buffers, END } from 'redux-saga';

// Ours
import { Request } from './utils/request';
import { Event, Respond, Fail } from './utils/events';
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
			next: data => emit(Respond(req, data)),
			error: error => emit(Fail(req, error)),
			complete: () => emit(END),
		};

		if (isIterable(stream)) {
			iter(stream, observer);
			return () => stream.return?.(null);
		}

		const $ = stream.subscribe(observer);
		return () => $.unsubscribe();
	}, buffers.expanding());
