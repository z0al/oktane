// Ours
import { Emitter } from './emitter';

test('should keep track of listeners', () => {
	const emitter = Emitter();

	const l1 = jest.fn();
	const l2 = jest.fn();
	const l3 = jest.fn();

	emitter.on('event', l1);
	emitter.on('event', l2);
	expect(emitter.listenerCount('event')).toEqual(2);

	emitter.off('event', l1);
	emitter.off('event', l2);
	expect(emitter.listenerCount('event')).toEqual(0);

	emitter.on('event', l3);
	expect(emitter.listenerCount('event')).toEqual(1);
});
