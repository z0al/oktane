// Ours
import { Operation } from './operations';

export type State =
	| 'idle'
	| 'pending'
	| 'failed'
	| 'streaming'
	| 'cancelled'
	| 'completed';

/**
 * Determines the next state given the current `state` and `operation`.
 *
 * @param state
 * @param operation
 */
export const transition = (
	state: State = 'idle',
	operation: Operation
): State => {
	const event = operation.type;

	switch (state) {
		// Expecting:
		// - fetch
		case 'idle':
		case 'failed':
		case 'cancelled':
		case 'completed': {
			if (event === 'fetch') {
				return 'pending';
			}

			break;
		}

		// Expecting:
		// - buffer
		// - reject
		// - cancel
		// - complete
		case 'pending':
		case 'streaming': {
			switch (event) {
				case 'buffer':
					return 'streaming';
				case 'reject':
					return 'failed';
				case 'cancel':
					return 'cancelled';
				case 'complete':
					return 'completed';
			}

			break;
		}
	}

	// fallback to current state
	return state;
};
