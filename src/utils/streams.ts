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
 * Return an subscriber from any value
 *
 * @param value
 */
const fromValue = <T>(value: unknown) => {
	// By default, we simply pass the value through
	let subscriber: SubscriberFunc = o => {
		o.next(value as T);
		o.complete();

		return () => {};
	};

	// Handle promises
	if (is.nativePromise(value)) {
		subscriber = o => {
			value
				.then(v => {
					o.next(v as T);
					o.complete();
				})
				.catch(e => o.error(e));

			return () => {};
		};
	}

	// DO NOT iterate over plain iterables (e.g Array)
	if (is.asyncIterable(value) || is.generator(value)) {
		subscriber = o => {
			(async () => {
				try {
					for await (const v of value) {
						o.next(v as T);
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

	return subscriber;
};

/**
 *
 *
 * @param value
 * @param observer
 */
export const subscribe = (value: any, observer: Observer) => {
	let closed = false;

	const closeAnd = (cb: CallableFunction) => (value?: any): void => {
		closed = true;
		return cb(value);
	};

	const subscriber: Subscriber = {
		closed,
		next: observer.next,
		error: closeAnd(observer.error),
		complete: closeAnd(observer.complete),
	};

	const cleanup = fromValue(value)(subscriber);
	const unsubscribe = closeAnd(cleanup);

	return { closed, unsubscribe };
};
