// Packages
import delay from 'delay';

// Ours
import { Client } from './client';
import { Exchange } from './utils/types';
import { createRequest } from './request';
import { $fetch, $cancel } from './utils/operations';

describe('client', () => {
	it('should not throw when no exchanges were passed', () => {
		expect(() => {
			new Client({} as any);
		}).not.toThrow();

		expect(() => {
			const handler = jest.fn();
			new Client({ handler, exchanges: [] });
			expect(handler).not.toBeCalled();
		}).not.toThrow();
	});

	describe('.fetch', () => {
		const query = createRequest({
			type: 'query',
			query: 'test',
			variables: [1, 2],
		});

		const stream = createRequest({
			type: 'stream',
			query: 'test',
			variables: [1, 2],
		});

		let handler: any;

		beforeEach(() => {
			handler = jest.fn().mockResolvedValue({ pass: true });
		});

		const logTo = (fn: any): Exchange => ({
			name: 'dummy',
			init: () => next => op => {
				fn(op);
				return next(op);
			},
		});

		it('should emit fetch operation', () => {
			const fn = jest.fn();
			const client = new Client({
				handler,
				exchanges: [logTo(fn)],
			});
			client.fetch(query);

			expect(fn).toBeCalledWith($fetch(query));
		});

		it('should not emit "fetch" if it is already pending', () => {
			const fn = jest.fn();
			const client = new Client({
				handler,
				exchanges: [logTo(fn)],
			});
			client.fetch(query);
			client.fetch(query);
			client.fetch(query);

			expect(fn).toBeCalledWith($fetch(query));
			expect(fn).toBeCalledTimes(1);
		});

		it('should call subscriber with state updates', async () => {
			const fetch = () => handler();

			const client = new Client({
				handler: fetch,
				exchanges: [],
			});

			let sub = jest.fn();
			client.fetch(query, sub);
			await delay(1);

			expect(sub).toBeCalledWith('pending', null);
			expect(sub).toBeCalledWith('completed', null);
			expect(sub).toBeCalledTimes(2);

			sub = jest.fn();
			client.fetch(query, sub).cancel();
			await delay(1);

			expect(sub).toBeCalledWith('pending', null);
			expect(sub).toBeCalledWith('cancelled', null);

			sub = jest.fn();
			client.fetch(stream, sub);
			await delay(1);

			expect(sub).toBeCalledWith('pending', null);
			expect(sub).toBeCalledWith('streaming', null);
			expect(sub).toBeCalledWith('completed', null);

			sub = jest.fn();
			handler = () => Promise.reject(null);
			client.fetch(query, sub);
			await delay(1);

			expect(sub).toBeCalledWith('pending', null);
			expect(sub).toBeCalledWith('failed', null);
		});

		it('should emit "cancel" on .cancel()', () => {
			const fn = jest.fn();
			const client = new Client({
				handler,
				exchanges: [logTo(fn)],
			});
			const { cancel } = client.fetch(query);
			cancel();

			expect(fn).toBeCalledWith($fetch(query));
			expect(fn).toBeCalledWith($cancel(query));
		});

		it('should remove listener on .unsubscribe()', async () => {
			const client = new Client({
				handler,
				exchanges: [],
			});

			const sub = jest.fn();
			const { unsubscribe } = client.fetch(query, sub);
			unsubscribe();

			await delay(1);

			expect(sub).toBeCalledWith('pending', null);
			expect(sub).toBeCalledTimes(1);
		});
	});
});
