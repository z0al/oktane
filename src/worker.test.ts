// Packages
import { put, take, cancelled } from 'redux-saga/effects';

// Ours
import InlineWorker from './worker';

const task = function*() {
	yield take('END');
	yield put({ type: 'DONE' });
};

test('should start/stop the root saga', () => {
	let isRunning = false;

	const forever = function*() {
		try {
			isRunning = true;
			yield take('FOREVER');
		} finally {
			if (yield cancelled()) {
				isRunning = false;
			}
		}
	};

	const w = new InlineWorker(forever);
	expect(isRunning).toBe(true);

	w.terminate();
	expect(isRunning).toBe(false);
});

test('should throw if onmessage is not implemented', () => {
	expect(() => {
		new InlineWorker(function*() {
			yield put({ type: 'FAIL' });
		});
	}).toThrowError(/Not implemented/);
});

test('should throw saga errors', () => {
	const error = new Error('FAIL');

	expect(() => {
		new InlineWorker(function*() {
			throw error;
		});
	}).toThrowError(error);
});

test('should dispatch events to saga', () => {
	const w = new InlineWorker(task);
	w.onmessage = jest.fn();

	w.postMessage({ type: 'END' } as any);

	expect(w.onmessage).toBeCalledTimes(1);
	expect(w.onmessage).toBeCalledWith({
		data: { type: 'DONE' },
	});
});
