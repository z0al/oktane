// Packages
import { Channel } from 'redux-saga';
import { take, call, put, cancelled } from 'redux-saga/effects';

// Ours
import * as $ from '../utils/events';
import { isStream } from '../utils/is';
import { streamChannel } from '../stream';
import { Request } from '../utils/request';
import { HandlerFunc } from '../utils/resolver';

export function* fetch(req: Request, func: HandlerFunc) {
	let channel: Channel<any>;

	try {
		// We have to wrap the call to `func()` inside a Promise to
		// bypass redux-saga. Otherwise, redux-saga will try to run
		// the result which will cause unexpected behavior.
		const data = yield call(async () => func());

		if (!isStream(data)) {
			yield put($.Response(req, data));
			return yield put($.Completed(req));
		}

		channel = yield streamChannel(data, req);
		while (true) {
			yield put(yield take(channel));
		}
	} catch (error) {
		return yield put($.Failure(req, error));
	} finally {
		// Unsubscribe
		channel?.close();

		if (yield cancelled()) {
			return yield put($.Cancelled(req));
		}
	}
}
