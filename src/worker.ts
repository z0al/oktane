// Packages
import { stdChannel, runSaga, Task, Saga } from '@redux-saga/core';

// Ours
import { noop } from './utils/noop';
import { Event } from './utils/events';

class InlineWorker implements Worker {
	_task: Task;
	_channel = stdChannel();
	_cache = {};

	constructor(fn: Saga, ...args: any[]) {
		const io = {
			channel: this._channel,
			// Used to handle uncaught errors
			onError: this._onerror.bind(this),
			// Used to fulfill `put` effects.
			dispatch: this._dispatch.bind(this),
			// Used to fulfill `select` and `getState` effects.
			getState: this._getCache.bind(this),
		};

		this._task = runSaga(io, fn, args);
	}

	private _dispatch(data: Event) {
		// Send events to the client
		this.onmessage({ data });
	}

	private _getCache() {
		return this._cache;
	}

	private _onerror(error: Error) {
		throw error;
	}

	postMessage(event: Event) {
		this._channel.put(event);
	}

	terminate() {
		this._task.cancel();
	}

	// Must be implemented by the client
	onerror = noop;
	onmessage = noop;

	// Mocked because we don't need them.
	addEventListener = noop;
	removeEventListener = noop;
	dispatchEvent = noop;
}

export default InlineWorker;
