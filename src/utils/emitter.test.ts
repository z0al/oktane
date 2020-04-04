// Ours
import { Emitter } from './emitter';

test('should keep the tracker updated', () => {
	const track = jest.fn();
	const emitter = Emitter(track);

	const l1 = jest.fn();
	const l2 = jest.fn();
	const l3 = jest.fn();

	emitter.on('event', l1);
	emitter.on('event', l2);
	expect(track).toBeCalledWith({ type: 'event', state: 'active' });

	emitter.off('event', l1);
	emitter.off('event', l2);
	expect(track).toBeCalledWith({ type: 'event', state: 'inactive' });
	expect(track).toBeCalledTimes(2);

	emitter.on('event', l3);
	expect(track).toBeCalledWith({ type: 'event', state: 'active' });
	expect(track).toBeCalledTimes(3);
});

test('should keep track of listeners', () => {
	const emitter = Emitter(jest.fn());

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
