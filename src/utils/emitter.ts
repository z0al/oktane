// Packages
import mitt from 'mitt';

type TrackerFunc = (s: 'active' | 'inactive', e: string) => void;

/**
 * Extends `mitt` to track listeners.
 */
export const Emitter = (track: TrackerFunc): mitt.Emitter => {
	const events = Object.create(null);
	const emitter = mitt(events);

	const listenerCount = (event: string) => {
		return (events[event] || []).length;
	};

	return {
		on: (type: string, handler: mitt.Handler) => {
			emitter.on(type, handler);

			if (listenerCount(type) === 1) {
				track('active', type);
			}
		},
		off: (type: string, handler: mitt.Handler) => {
			emitter.off(type, handler);

			if (listenerCount(type) === 0) {
				track('inactive', type);
			}
		},
		emit: emitter.emit.bind(emitter),
	};
};
