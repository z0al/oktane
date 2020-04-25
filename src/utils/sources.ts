// Ours
import is from './is';

export type Source =
	// Promise OR
	// IterableIterator OR
	// AsyncIterableIterator OR
	// SubscriptionFunc OR
	// any
	any;

export interface Subscriber {
	next(value: any): void;
	error(error: any): void;
	complete(value?: any): void;
}

export interface Subscription {
	lazy?: boolean;
	next?: () => Promise<void>;
	close: () => void;
	isClosed: () => boolean;
}

export type SubscriptionFunc = (
	subscriber: Subscriber
) => (() => void) | void;

/**
 * Subscribes to a given Source and returns subscription object.
 *
 * @param source
 * @param subscriber
 */
export const subscribe = (
	source: Source,
	subscriber: Subscriber
): Subscription => {
	let lazy = false;
	let closed = false;
	let next: () => Promise<void>;
	let observe: SubscriptionFunc;

	// Observable-like subscription
	if (is.func(source)) {
		observe = (observer: Subscriber) => source(observer);
	}

	// Iterator / Generator
	else if (is.iterator(source)) {
		lazy = true;

		observe = (observer: Subscriber) => {
			next = async () => {
				if (!closed) {
					try {
						const r = await source.next();

						if (r.done) {
							return observer.complete(r.value);
						}

						observer.next(r.value);
					} catch (error) {
						observer.error(error);
					}
				}
			};

			return () => source?.return?.(null);
		};
	}

	// Promise / Other
	else {
		observe = (observer: Subscriber) => {
			(async () => {
				try {
					observer.complete(await source);
				} catch (error) {
					observer.error(error);
				}
			})();
		};
	}

	const teardown = (cb: any) => (...args: any[]) => {
		if (!closed) {
			closed = true;
			cb && cb(...args);
		}
	};

	const close = teardown(
		observe({
			error: teardown(subscriber.error),
			complete: teardown(subscriber.complete),
			next: (val) => !closed && subscriber.next(val),
		})
	);

	// emit first value immediately
	if (lazy) {
		next();
	}

	return { lazy, next, close, isClosed: () => closed };
};
