// Packages
import is from '@sindresorhus/is';
import ZObservable from 'zen-observable';

/**
 * Creates a new Observable instance from `value`
 *
 * @param value
 */
const from = <T>(value: unknown) => {
	// By default, we simply pass the value through
	let subscriber: ZenObservable.Subscriber<T> = o => {
		o.next(value as T);
		o.complete();
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

	return create(subscriber);
};

/**
 * Creates a new Observable instance
 *
 * @param subscriber
 */
const create = <T>(subscriber: ZenObservable.Subscriber<T>) =>
	new ZObservable(subscriber);

export type Observer = ZenObservable.Observer<any>;
export type Subscription = ZenObservable.Subscription;
export const Observable = { create, from };
