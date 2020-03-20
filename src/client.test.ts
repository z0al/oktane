// Packages
import delay from 'delay';

// Ours
import { Client } from './client';
import { createRequest } from './request';
import { Exchange, EmitFunc } from './utils/types';
import {
	$fetch,
	$cancel,
	$reject,
	$buffer,
	$complete,
} from './utils/operations';

describe('client', () => {
	// FIXME: enable this when we have fetch exchange ready
	it.skip('should not throw when no exchanges were passed', () => {
		expect(() => {
			new Client({});
		}).not.toThrow();

		expect(() => {
			new Client({ exchanges: [] });
		}).not.toThrow();
	});

	describe('.fetch', () => {
		const request = createRequest({
			type: 'query',
			query: 'test',
			variables: [1, 2],
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
				exchanges: [logTo(fn)],
			});
			client.fetch(request);

			expect(fn).toBeCalledWith($fetch(request));
		});

		it('should not emit "fetch" if it is already pending', () => {
			const fn = jest.fn();
			const client = new Client({
				exchanges: [logTo(fn)],
			});
			client.fetch(request);
			client.fetch(request);
			client.fetch(request);

			expect(fn).toBeCalledWith($fetch(request));
			expect(fn).toBeCalledTimes(1);
		});

		it('should call subscriber with state updates', () => {
			let fire: EmitFunc;

			const client = new Client({
				exchanges: [
					{
						name: 'dummy',
						init: ({ emit }) => next => op => {
							if (!fire) {
								fire = emit;
							}
							return next(op);
						},
					},
				],
			});

			const sub = jest.fn();
			client.fetch(request, sub); // 1

			fire($cancel(request)); // 2
			fire($fetch(request)); // 3
			fire($reject(request, null)); // 4
			fire($fetch(request)); // 5
			fire($buffer(request, null)); // 6
			fire($complete(request)); // 7

			expect(sub).toBeCalledWith('pending', null);
			expect(sub).toBeCalledWith('cancelled', null);
			expect(sub).toBeCalledWith('pending', null);
			expect(sub).toBeCalledWith('failed', null);
			expect(sub).toBeCalledWith('streaming', null);
			expect(sub).toBeCalledWith('completed', null);
			expect(sub).toBeCalledTimes(7);
		});

		it('should emit "cancel" on .cancel()', () => {
			const fn = jest.fn();
			const client = new Client({
				exchanges: [logTo(fn)],
			});
			const { cancel } = client.fetch(request);
			cancel();

			expect(fn).toBeCalledWith($fetch(request));
			expect(fn).toBeCalledWith($cancel(request));
		});

		it('should remove listener on .unsubscribe()', async () => {
			const fn = jest.fn();
			const sub = jest.fn();

			const client = new Client({
				exchanges: [
					logTo(fn),
					{
						name: 'cancel',
						init: ({ emit }) => next => op => {
							const n = next(op);
							if (op.type !== 'cancel') {
								setTimeout(() => {
									emit($cancel(request));
								}, 50);
							}
							return n;
						},
					},
				],
			});

			const { unsubscribe } = client.fetch(request, sub);
			unsubscribe();

			await delay(150);

			expect(fn).toBeCalledWith($fetch(request));
			expect(sub).toBeCalledWith('pending', null);
			expect(sub).toBeCalledTimes(1);
		});
	});
});
