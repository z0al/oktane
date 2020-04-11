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

export interface Source {
	(o: Subscriber): () => void;
	lazy?: boolean;
	// Emits next value on a lazy source
	next?: () => Promise<void>;
}

/**
 * Transforms a spec-compliant JS Observable into a Source.
 *
 * @param o
 */
export const fromObservable = (o: any): Source => {
	return subscriber => {
		const observable = o.subscribe(subscriber);

		return () => observable?.unsubscribe?.();
	};
};

/**
 * Transforms a function into a lazy Source.
 *
 * @param fn
 */
export const fromCallback = (fn: Function): Source => {
	let subscriber: Subscriber;

	const next = async () => {
		try {
			const value = await fn();

			// End of source
			if (value === undefined || value === null) {
				subscriber.complete();
			} else {
				subscriber.next(value);
			}
		} catch (error) {
			subscriber.error(error);
		}
	};

	const source: Source = sub => {
		// Keep subscriber ref and emit the first value
		subscriber = sub;
		next();

		return () => {};
	};

	source.lazy = true;
	source.next = next;

	return source;
};

/**
 * Transforms a Promise into a Source that emits the resolved value
 * or fails if the promise rejected.
 *
 * @param p
 */
export const fromPromise = (p: Promise<unknown>): Source => {
	return subscriber => {
		p.then(v => {
			subscriber.complete(v);
		}).catch(e => subscriber.error(e));

		return () => {};
	};
};

/**
 * Transforms a value into a Source that emits the value and
 * completes immediately afterwards.
 *
 * @param value
 */
export const fromValue = (value: unknown): Source => {
	return fromPromise(Promise.resolve(value));
};

/**
 * Transforms give value into a Source that emits value(s) over time.
 *
 * @param value
 */
export const fromAny = (value: unknown): Source => {
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
 * Subscribes to a Source and a subscription object that can be used
 * to unsubscribe later.
 *
 * @param source
 * @param observer
 */
export const subscribe = (
	source: Source,
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
		next: value => {
			if (!closed) {
				observer.next(value);
			}
		},
		error: end(observer.error),
		complete: end(observer.complete),
	};

	const cleanup = source(subscriber);
	const close = end(cleanup);

	return {
		close,
		isClosed: () => closed,
		lazy: source.lazy,
		next: source.next,
	};
};
