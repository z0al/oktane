// Ours
import { Emitter } from './emitter';

test('hasSubscribers', () => {
	const emitter = Emitter();

	const l1 = jest.fn();
	const l2 = jest.fn();
	const l3 = jest.fn();

	emitter.on('event', l1);
	emitter.on('event', l2);
	expect(emitter.hasSubscribers('event')).toEqual(true);

	emitter.off('event', l1);
	emitter.off('event', l2);
	expect(emitter.hasSubscribers('event')).toEqual(false);

	emitter.on('event', l3);
	expect(emitter.hasSubscribers('event')).toEqual(true);
});
