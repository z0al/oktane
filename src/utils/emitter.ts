// Packages
import mitt from 'mitt';

/**
 * Extends `mitt` to track listeners.
 */
export const Emitter = () => {
	const events = Object.create(null);

	return {
		...mitt(events),
		hasSubscribers(type: string) {
			return (events[type] || []).length !== 0;
		},
	};
};
