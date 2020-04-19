// Ours
import { Operation } from './operations';

export type Status =
	| 'ready'
	| 'pending'
	| 'failed'
	| 'buffering'
	| 'cancelled'
	| 'completed'
	| 'disposed';

/**
 * Determines the next status given the current `status` and `operation`.
 *
 * @param status
 * @param operation
 */
export const transition = (
	status: Status = 'ready',
	operation: Operation
): Status => {
	const event = operation.type;

	if (event === 'dispose') {
		return 'disposed';
	}

	switch (status) {
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

	// fallback to current status
	return status;
};
