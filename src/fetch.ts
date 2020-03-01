// Packages
import { call, put } from 'redux-saga/effects';

// Ours
import { Event } from './utils/events';
import { Request } from './utils/request';
import { ResolverFn } from './utils/resolver';

function* fetch(req: Request, resolve: ResolverFn) {
	try {
		const result = yield call(resolve);

		const success: Event = {
			type: '@data',
			data: {
				res: {
					request: {
						id: req.id,
						type: req.type,
					},
					data: result,
					done: true,
				},
			},
		};

		return yield put(success);
	} catch (error) {
		const failed: Event = {
			type: '@failed',
			data: {
				req: {
					id: req.id,
					type: req.type,
				},
				error,
			},
		};

		return yield put(failed);
	}
}

export default fetch;
