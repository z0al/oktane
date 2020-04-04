// Packages
import mitt from 'mitt';

type EventState = { type: string; state: 'active' | 'inactive' };
export type TrackerFunc = (e: EventState) => void;

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
				track({ type, state: 'active' });
			}
		},
		off: (type: string, handler: mitt.Handler) => {
			emitter.off(type, handler);

			if (listenerCount(type) === 0) {
				track({ type, state: 'inactive' });
			}
		},
		emit: emitter.emit.bind(emitter),
	};
};
