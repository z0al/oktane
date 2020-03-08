// Packages
import { take, call, put } from 'redux-saga/effects';

// Ours
import { streamChannel } from '../stream';
import { Request } from '../utils/request';
import { isStream, Stream } from '../utils/is';
import { HandlerFunc } from '../utils/resolver';
import { Response, Failure, Completed } from '../utils/events';

export function* fetch(req: Request, func: HandlerFunc) {
	let data: Stream | any;

	try {
		// We have to wrap the call to `func()` inside a Promise to
		// bypass redux-saga. Otherwise, redux-saga will try to run
		// the result which will cause unexpected behavior.
		data = yield call(async () => func());

		if (!isStream(data)) {
			yield put(Response(req, data));
			return yield put(Completed(req));
		}
	} catch (error) {
		return yield put(Failure(req, error));
	} finally {
		// TODO: check for cancelation
	}

	const channel = yield streamChannel(data, req);

	try {
		while (true) {
			yield put(yield take(channel));
		}
	} finally {
		channel.close();
		// TODO: check for cancelation
	}
}
