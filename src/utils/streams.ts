// Packages
import is from '@sindresorhus/is';

export interface Observer {
	next(value: any): void;
	error(error: any): void;
	complete(value?: any): void;
}

export interface Subscriber extends Observer {
	closed: boolean;
}

export interface Subscription {
	isClosed: () => boolean;
	close: () => void;
	lazy?: boolean;
	next?: () => Promise<void>;
}

/**
 * A stream is a source that emits value(s) over time.
 */
export interface Stream {
	(o: Subscriber): () => void;
	lazy?: boolean;
	// Emits next value on a lazy stream
	next?: () => Promise<void>;
}

/**
 * Transforms a spec-compliant JS Observable into a Stream.
 *
 * @param o
 */
export const fromObservable = (o: any): Stream => {
	return (subscriber) => {
		const observable = o.subscribe(subscriber);

		return () => observable?.unsubscribe?.();
	};
};

/**
 * Transforms a function into a lazy Stream.
 *
 * @param fn
 */
export const fromCallback = (fn: Function): Stream => {
	let subscriber: Subscriber;

	const next = async () => {
		try {
			const value = await fn();

			// End of Stream
			if (value === undefined || value === null) {
				subscriber.complete();
			} else {
				subscriber.next(value);
			}
		} catch (error) {
			subscriber.error(error);
		}
	};

	const stream: Stream = (sub) => {
		// Keep subscriber ref and emit the first value
		subscriber = sub;
		next();

		return () => {};
	};

	stream.lazy = true;
	stream.next = next;

	return stream;
};

/**
 * Transforms a Promise into a Stream that emits the resolved value
 * or fails if the promise rejected.
 *
 * @param p
 */
export const fromPromise = (p: Promise<unknown>): Stream => {
	return (subscriber) => {
		p.then((v) => {
			subscriber.complete(v);
		}).catch((e) => subscriber.error(e));

		return () => {};
	};
};

/**
 * Transforms a value into a Stream that emits the value and
 * completes immediately afterwards.
 *
 * @param value
 */
export const fromValue = (value: unknown): Stream => {
	return fromPromise(Promise.resolve(value));
};

/**
 * Transforms give value into a Stream.
 *
 * @param value
 */
export const from = (value: unknown): Stream => {
	if (is.function_(value)) {
		return fromCallback(value);
	}

	if (is.observable(value)) {
		return fromObservable(value);
	}

	if (is.nativePromise(value)) {
		return fromPromise(value);
	}

	return fromValue(value);
};

/**
 * Subscribes to a Stream and a subscription object that can be used
 * to unsubscribe later.
 *
 * @param stream
 * @param observer
 */
export const subscribe = (
	stream: Stream,
	observer: Observer
): Subscription => {
	let closed = false;

	const end = (cb: any) => (value?: any) => {
		if (!closed) {
			closed = true;
			cb(value);
		}
	};

	const subscriber: Subscriber = {
		closed,
		next: (value) => {
			if (!closed) {
				observer.next(value);
			}
		},
		error: end(observer.error),
		complete: end(observer.complete),
	};

	const cleanup = stream(subscriber);
	const close = end(cleanup);

	return {
		close,
		isClosed: () => closed,
		lazy: stream.lazy,
		next: stream.next,
	};
};
