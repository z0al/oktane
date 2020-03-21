// Packages
import is from '@sindresorhus/is';

interface Observer {
	next(value: any): void;
	error(error: any): void;
	complete(): void;
}

interface Subscriber extends Observer {
	closed: boolean;
}

type SubscriberFunc = (o: Subscriber) => () => void;

/**
 * Convert to a value to a stream that resolves once
 *
 * @param value
 */
export const fromValue = (value: unknown) => {
	let subscriber: SubscriberFunc = o => {
		o.next(value);
		o.complete();

		return () => {};
	};

	// Handle promises
	if (is.nativePromise(value)) {
		subscriber = o => {
			value
				.then(v => {
					o.next(v);
					o.complete();
				})
				.catch(e => o.error(e));

			return () => {};
		};
	}

	return subscriber;
};

/**
 * Return an subscriber from any value
 *
 * @param value
 */
export const fromStream = (value: unknown) => {
	// By default, we simply pass the value through
	let subscriber: SubscriberFunc;

	// DO NOT iterate over plain iterables (e.g Array)
	if (is.asyncIterable(value) || is.generator(value)) {
		subscriber = o => {
			(async () => {
				try {
					for await (const v of value) {
						o.next(v);
					}
				} catch (error) {
					o.error(error);
				}

				return o.complete();
			})();

			return () => value.return?.(null);
		};
	}

	if (is.observable(value)) {
		subscriber = o => {
			const sub = (value.subscribe(
				o as any
			) as unknown) as ZenObservable.Subscription;

			return () => sub.unsubscribe();
		};
	}

	if (!subscriber) {
		subscriber = fromValue(value);
	}

	return subscriber;
};

/**
 *
 *
 * @param value
 * @param observer
 */
export const subscribe = (fn: SubscriberFunc, observer: Observer) => {
	let closed = false;

	const closeAnd = (cb: CallableFunction) => (value?: any): void => {
		if (!closed) {
			cb(value);
			closed = true;
		}
	};

	const subscriber: Subscriber = {
		closed,
		next: value => {
			if (!closed) {
				observer.next(value);
			}
		},
		error: closeAnd(observer.error),
		complete: closeAnd(observer.complete),
	};

	const cleanup = fn(subscriber);
	const unsubscribe = closeAnd(cleanup);

	return { closed, unsubscribe };
};
