// Packages
import { call, put } from 'redux-saga/effects';

// Ours
import fetch from './fetch';
import { createRequest } from './utils/request';

const req = createRequest({
	type: 'query',
	query: 'test',
});

test('should catch errors', () => {
	const error = new Error('runtime error');
	const fn = jest.fn();

	const itr = fetch(req, fn);
	itr.next();

	const event = {
		type: '@failed',
		data: {
			req: {
				id: req.id,
				type: req.type,
			},
			error,
		},
	};

	expect(itr.throw(error).value).toEqual(put(event));
});

test('should emit data on success', () => {
	const fn = jest.fn();
	const users = [{ name: 'A' }, { name: 'B' }];

	const event = {
		type: '@data',
		data: {
			res: {
				data: users,
				done: true,
				request: {
					id: req.id,
					type: req.type,
				},
			},
		},
	};

	const itr = fetch(req, fn);
	expect(itr.next().value).toEqual(call(fn));
	expect(itr.next(users).value).toEqual(put(event));
});
