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

interface Subscription {
	closed: boolean;
	close: () => void;
}

type Source = (o: Subscriber) => () => void;

/**
 * Transforms a value into a {@link Source} that emits the value
 * and completes immediately afterwards.
 *
 * @example From Promise
 * const promise = Promise.resolve('Works!')
 * const source = fromValue(promise)
 *
 * subscribe(source, {
 * 	next: value => console.log(value), // should log: Works!
 *  // ... other handlers
 * })
 *
 * @example Anything else
 * const anything = 'Works'
 * const source = fromValue(anything)
 *
 * subscribe(source, {
 * 	next: value => console.log(value), // should log: Works!
 *  // ... other handlers
 * })
 *
 * @param value
 */
export const fromValue = (value: unknown) => {
	let source: Source;

	// Handle promises
	if (is.nativePromise(value)) {
		source = (sub) => {
			value
				.then((v) => {
					sub.next(v);
					sub.complete();
				})
				.catch((e) => sub.error(e));

			return () => {};
		};
	}

	if (!source) {
		source = (sub) => {
			const timeout = setTimeout(() => {
				sub.next(value);
				sub.complete();
			});

			return () => clearTimeout(timeout);
		};
	}

	return source;
};

/**
 * Transforms a stream into a {@link Source} that emits value(s) over time.
 *
 * A stream can be one of three things:
 * - Async iterable or
 * - Generator or
 * - Observable (tested with RxJS & zen-observable)
 *
 * If `value` doesn't satisfy any of the types above we fall back to
 * {@link fromValue}.
 *
 * @example From RxJS Observable
 * const observable = Rx.from([1,2,3])
 * const source = fromStream(observable)
 *
 * subscribe(source, {
 * 	next: value => console.log(value), // should log: 1 2 3
 *  // ... other handlers
 * })
 *
 * @param value
 */
export const fromStream = (value: unknown) => {
	let source: Source;

	// DO NOT iterate over plain iterables (e.g Array)
	if (is.asyncIterable(value) || is.generator(value)) {
		source = (sub) => {
			(async () => {
				try {
					for await (const v of value) {
						sub.next(v);
					}
				} catch (error) {
					sub.error(error);
				}

				return sub.complete();
			})();

			return () => value.return?.(null);
		};
	}

	if (is.observable(value)) {
		source = (sub) => {
			const observable: any = value.subscribe(sub as any);

			return () => observable?.unsubscribe?.();
		};
	}

	if (!source) {
		source = fromValue(value);
	}

	return source;
};

/**
 * Subscribes to a {@link Source} and a subscription object that
 * can be used to unsubscribe later.
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
		next: (value) => {
			if (!closed) {
				observer.next(value);
			}
		},
		error: end(observer.error),
		complete: end(observer.complete),
	};

	const cleanup = source(subscriber);
	const close = end(cleanup);

	return { closed, close };
};
