// Ours
import is from './is';

export interface SourceObserver {
	next(value: any): void;
	error(error: any): void;
	complete(value?: any): void;
}

export interface SourceSubscriber extends SourceObserver {
	closed: boolean;
}

/**
 * Stream interface
 */
export interface Stream {
	isClosed: () => boolean;
	close: () => void;
	pull?: boolean;
	next?: () => Promise<void>;
}

/**
 * A Source is a function that emits a stream of values when
 * subscribed to.
 */
export interface Source {
	pull?: boolean;
	subscribe(
		s: SourceSubscriber
	): {
		next?: () => Promise<void>;
		unsubscribe: () => void;
	};
}

/**
 * Transforms a spec-compliant JS Observable into a Source.
 *
 * @param o
 */
export const fromObservable = (o: any): Source => {
	return {
		subscribe: (subscriber) => {
			const observable = o.subscribe(subscriber);

			return {
				unsubscribe: () => observable?.unsubscribe?.(),
			};
		},
	};
};

/**
 * Transforms a function into a Source.
 *
 * @param cb
 */
export const fromCallback = (
	cb: () => IteratorResult<any> | Promise<IteratorResult<any>>
): Source => {
	const source: Source = {
		pull: true,
		subscribe: (subscriber) => ({
			next: async () => {
				try {
					const { value, done } = await cb();

					if (done) {
						return subscriber.complete();
					}

					subscriber.next(value);
				} catch (error) {
					subscriber.error(error);
				}
			},
			unsubscribe: () => {},
		}),
	};

	return source;
};

/**
 * Transforms a Promise into a Source that emits the resolved
 * value or fails if the promise rejected.
 *
 * @param p
 */
export const fromPromise = (p: Promise<unknown>): Source => {
	return {
		subscribe: (subscriber) => {
			p.then((v) => {
				subscriber.complete(v);
			}).catch((e) => subscriber.error(e));

			return {
				unsubscribe: () => {},
			};
		},
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
 * Transforms give value into a Source.
 *
 * @param value
 */
export const from = (value: unknown): Source => {
	if (is.func(value)) {
		return fromCallback(value as any);
	}

	if (is.observable(value)) {
		return fromObservable(value);
	}

	if (is.promise(value)) {
		return fromPromise(value);
	}

	return fromValue(value);
};

/**
 * Subscribes to given Source and returns a Stream.
 *
 * @param source
 * @param observer
 */
export const subscribe = (
	source: Source,
	observer: SourceObserver
): Stream => {
	let closed = false;

	const end = (cb: any) => (value?: any) => {
		if (!closed) {
			closed = true;
			cb(value);
		}
	};

	const subscription = source.subscribe({
		closed,
		next: (value) => {
			if (!closed) {
				observer.next(value);
			}
		},
		error: end(observer.error),
		complete: end(observer.complete),
	});

	const close = end(subscription.unsubscribe);

	// pull first value immediately
	if (source.pull) {
		subscription.next();
	}

	return {
		close,
		isClosed: () => closed,
		pull: source.pull,
		next: async () => {
			if (!closed) {
				subscription.next();
			}
		},
	};
};
