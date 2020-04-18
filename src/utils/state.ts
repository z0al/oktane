// Ours
import { Operation } from './operations';

export type State =
	| 'ready'
	| 'pending'
	| 'failed'
	| 'buffering'
	| 'cancelled'
	| 'completed'
	| 'disposed';

/**
 * Determines the next state given the current `state` and `operation`.
 *
 * @param state
 * @param operation
 */
export const transition = (
	state: State = 'ready',
	operation: Operation
): State => {
	const event = operation.type;

	if (event === 'dispose') {
		return 'disposed';
	}

	switch (state) {
		// Expecting:
		// - fetch
		case 'ready':
		case 'failed':
		case 'cancelled':
		case 'completed':
		case 'disposed': {
			if (event === 'fetch') {
				return 'pending';
			}

			break;
		}

		// Expecting:
		// - put
		// - reject
		// - cancel
		// - complete
		case 'pending':
		case 'buffering': {
			switch (event) {
				case 'put':
					if (operation.meta?.pull) {
						return 'ready';
					}

					return 'buffering';
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
