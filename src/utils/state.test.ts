// Ours
import { transition } from './state';

const TESTS = [
	// idle
	{
		current: 'idle',
		operation: { type: 'fetch' },
		expected: 'pending',
	},
	{
		current: 'idle',
		operation: { type: 'cancel' },
		expected: 'idle',
	},
	{
		current: 'idle',
		operation: { type: 'reject' },
		expected: 'idle',
	},
	{
		current: 'idle',
		operation: { type: 'buffer' },
		expected: 'idle',
	},
	{
		current: 'idle',
		operation: { type: 'complete' },
		expected: 'idle',
	},
	// pending
	{
		current: 'pending',
		operation: { type: 'fetch' },
		expected: 'pending',
	},
	{
		current: 'pending',
		operation: { type: 'cancel' },
		expected: 'cancelled',
	},
	{
		current: 'pending',
		operation: { type: 'reject' },
		expected: 'failed',
	},
	{
		current: 'pending',
		operation: { type: 'buffer' },
		expected: 'streaming',
	},
	{
		current: 'pending',
		operation: { type: 'complete' },
		expected: 'completed',
	},
	// failed
	{
		current: 'failed',
		operation: { type: 'fetch' },
		expected: 'pending',
	},
	{
		current: 'failed',
		operation: { type: 'cancel' },
		expected: 'failed',
	},
	{
		current: 'failed',
		operation: { type: 'reject' },
		expected: 'failed',
	},
	{
		current: 'failed',
		operation: { type: 'buffer' },
		expected: 'failed',
	},
	{
		current: 'failed',
		operation: { type: 'complete' },
		expected: 'failed',
	},
	// streaming
	{
		current: 'streaming',
		operation: { type: 'fetch' },
		expected: 'streaming',
	},
	{
		current: 'streaming',
		operation: { type: 'cancel' },
		expected: 'cancelled',
	},
	{
		current: 'streaming',
		operation: { type: 'reject' },
		expected: 'failed',
	},
	{
		current: 'streaming',
		operation: { type: 'buffer' },
		expected: 'streaming',
	},
	{
		current: 'streaming',
		operation: { type: 'complete' },
		expected: 'completed',
	},
	// cancelled
	{
		current: 'cancelled',
		operation: { type: 'fetch' },
		expected: 'pending',
	},
	{
		current: 'cancelled',
		operation: { type: 'cancel' },
		expected: 'cancelled',
	},
	{
		current: 'cancelled',
		operation: { type: 'reject' },
		expected: 'cancelled',
	},
	{
		current: 'cancelled',
		operation: { type: 'buffer' },
		expected: 'cancelled',
	},
	{
		current: 'cancelled',
		operation: { type: 'complete' },
		expected: 'cancelled',
	},
	// completed
	{
		current: 'completed',
		operation: { type: 'fetch' },
		expected: 'pending',
	},
	{
		current: 'completed',
		operation: { type: 'cancel' },
		expected: 'completed',
	},
	{
		current: 'completed',
		operation: { type: 'reject' },
		expected: 'completed',
	},
	{
		current: 'completed',
		operation: { type: 'buffer' },
		expected: 'completed',
	},
	{
		current: 'completed',
		operation: { type: 'complete' },
		expected: 'completed',
	},
	// undefined
	{
		current: undefined,
		operation: { type: 'fetch' },
		expected: 'pending',
	},
	// dispose
	{
		current: 'idle',
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
	{
		current: 'pending',
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
	{
		current: 'streaming',
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
	{
		current: 'failed',
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
	{
		current: 'cancelled',
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
	{
		current: 'completed',
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
	{
		current: undefined,
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
];

test('transition', () => {
	for (const t of TESTS) {
		// @ts-ignore
		expect(transition(t.current, t.operation)).toEqual(t.expected);
	}
});
