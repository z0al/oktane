// Ours
import { Plugin } from './api';
import { transition } from '../utils/status';

export const dedupe: Plugin = {
	name: 'core/dedupe',
	init: ({ cache }) => (next) => (op) => {
		const { status } = cache.get(op.payload.request.id) || {};

		// next state update
		const derived = transition(status, op);

		// Skip any Operation that doesn't change the status. The only
		// exception is "put" operation since it doesn't change the
		// status when performed twice.
		if (status !== 'buffering' && derived === status) {
			return op;
		}

		return next(op);
	},
};
