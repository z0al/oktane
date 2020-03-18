// Ours
import { createEmitter } from './emitter';

test('createEmitter', () => {
	const emitter = createEmitter();

	const l1 = jest.fn();
	const l2 = jest.fn();

	emitter.on('*', l1);
	emitter.on('*', l2);
	expect(emitter.listenerCount('*')).toEqual(2);

	emitter.off('*', l1);
	emitter.off('*', l1);
	expect(emitter.listenerCount('*')).toEqual(1);

	emitter.on('*', l1);
	emitter.off('*', l2);
	expect(emitter.listenerCount('*')).toEqual(1);

	emitter.off('*', l1);
	emitter.off('*', l2);
	expect(emitter.listenerCount('*')).toEqual(0);
});
