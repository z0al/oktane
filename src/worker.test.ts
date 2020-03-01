// Packages
import { put, take } from '@redux-saga/core/effects';

// Ours
import InlineWorker from './worker';

const task = function*() {
	yield take('END');
	yield put({ type: 'DONE' });
};

it('should start/stop the root saga', () => {
	const w = new InlineWorker(task);
	expect(w._task.isRunning()).toBe(true);

	w.terminate();
	expect(w._task.isRunning()).toBe(false);
});

it('should throw if onmessage is not implemented', () => {
	expect(() => {
		new InlineWorker(function*() {
			yield put({ type: 'FAIL' });
		});
	}).toThrowError(/Not implemented/);
});

it('should throw saga errors', () => {
	const error = new Error('FAIL');

	expect(() => {
		new InlineWorker(function*() {
			throw error;
		});
	}).toThrowError(error);
});

it('should dispatch events to saga', () => {
	const w = new InlineWorker(task);
	w.onmessage = jest.fn();

	w.postMessage({ type: 'END' } as any);

	expect(w.onmessage).toBeCalledTimes(1);
	expect(w.onmessage).toBeCalledWith({
		data: { type: 'DONE' },
	});
});
