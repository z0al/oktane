// Ours
import { transition } from './state';

const TESTS = [
	// ready
	{
		current: 'ready',
		operation: { type: 'fetch' },
		expected: 'pending',
	},
	{
		current: 'ready',
		operation: { type: 'cancel' },
		expected: 'ready',
	},
	{
		current: 'ready',
		operation: { type: 'reject' },
		expected: 'ready',
	},
	{
		current: 'ready',
		operation: { type: 'put' },
		expected: 'ready',
	},
	{
		current: 'ready',
		operation: { type: 'complete' },
		expected: 'ready',
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
		operation: { type: 'put' },
		expected: 'buffering',
	},
	{
		current: 'pending',
		operation: { type: 'put', meta: { lazy: true } },
		expected: 'ready',
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
		operation: { type: 'put' },
		expected: 'failed',
	},
	{
		current: 'failed',
		operation: { type: 'complete' },
		expected: 'failed',
	},
	// buffering
	{
		current: 'buffering',
		operation: { type: 'fetch' },
		expected: 'buffering',
	},
	{
		current: 'buffering',
		operation: { type: 'cancel' },
		expected: 'cancelled',
	},
	{
		current: 'buffering',
		operation: { type: 'reject' },
		expected: 'failed',
	},
	{
		current: 'buffering',
		operation: { type: 'put' },
		expected: 'buffering',
	},
	{
		current: 'buffering',
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
		operation: { type: 'put' },
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
		operation: { type: 'put' },
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
		current: 'ready',
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
	{
		current: 'pending',
		operation: { type: 'dispose' },
		expected: 'disposed',
	},
	{
		current: 'buffering',
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
