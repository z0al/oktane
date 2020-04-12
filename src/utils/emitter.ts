// Packages
import mitt from 'mitt';

/**
 * Extends `mitt` to track listeners.
 */
export const Emitter = () => {
	const events = Object.create(null);
	const emitter = mitt(events);

	const listenerCount = (event: string) => {
		return (events[event] || []).length;
	};

	return {
		...emitter,
		hasSubscribers(event: string) {
			return listenerCount(event) !== 0;
		},
	};
};
