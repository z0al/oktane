// Packages
import mitt from 'mitt';

interface EventEmitter extends mitt.Emitter {
	listenerCount: (eventName: string) => number;
}

/**
 * Extends `mitt` to track listeners.
 */
export const Emitter = (): EventEmitter => {
	const listeners = Object.create(null);
	const listenerCount = (event: string) => {
		return (listeners[event] || []).length;
	};

	return { ...mitt(listeners), listenerCount };
};
