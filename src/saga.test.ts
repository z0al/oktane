// Packages
import { channel } from 'redux-saga';
import { actionChannel, take, call, spawn } from 'redux-saga/effects';

// Ours
import saga from './saga';
import fetch from './fetch';
import { createRequest } from './utils/request';

let config: any, pattern: any, events: any, event: any;

beforeEach(() => {
	config = { resolver: jest.fn() };
	pattern = actionChannel('@fetch');
	events = channel();

	event = {
		type: '@fetch' as any,
		data: {
			req: createRequest({ type: 'query', query: 'test' }),
		},
	};
});

test('should listen to fetch events', () => {
	const itr = saga(config);

	// Steps
	// 1. create a channel
	expect(itr.next().value).toEqual(pattern);
	// 2. listen for events
	expect(itr.next(events).value).toEqual(take(events));
});

test('should call the resolver with the request', () => {
	const itr = saga(config);

	// Steps
	// 1. create a channel
	itr.next();
	// 2. listen for events
	itr.next(events);
	// 3. Receive an event
	expect(itr.next(event).value).toEqual(
		call(config.resolver, event.data.req)
	);
});

test('should spawn a fetch call', () => {
	const itr = saga(config);
	const fn = jest.fn();

	// Steps
	// 1. create a channel
	itr.next();
	// 2. listen for events
	itr.next(events);
	// 3. Receive an event
	itr.next(event);
	// 4. Handle the request
	expect(itr.next(fn as any).value).toEqual(
		spawn(fetch, event.data.req, fn)
	);
});
