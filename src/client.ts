// Ours
import { pipe } from './utils/pipe';
import { Request } from './request';
import { Emitter } from './utils/emitter';
import { transition, State } from './utils/state';
import { Exchange, EmitFunc } from './utils/types';
import { Operation, $fetch, $cancel } from './utils/operations';

export interface ClientOptions {
	exchanges?: Array<Exchange>;
}

export type Subscriber = (state: State, data?: any) => void;

export class Client {
	private events = Emitter();
	private stateMap = new Map<string, State>();
	private intake: EmitFunc;

	constructor(options?: ClientOptions) {
		const config = { emit: this.emit.bind(this) };
		this.intake = pipe(options?.exchanges, config);
	}

	/**
	 * Extracts request ID
	 *
	 * @param op
	 */
	private key(op: Operation) {
		return op.payload.request.id;
	}

	/**
	 * Emits an event of type `request.id` and `op` as a payload
	 *
	 * @param op
	 */
	private emit(op: Operation) {
		const key = this.key(op);
		this.stateMap.set(key, transition(this.stateMap.get(key), op));
		this.events.emit(key, op);
	}

	/**
	 * Compares the next state against the current state and pass
	 * the `op` through the pipeline if necessary.
	 *
	 * @param op
	 */
	private apply(op: Operation) {
		const current = this.stateMap.get(this.key(op));
		const next = transition(current, op);

		// Rule:
		// If it won't change the current state DO NOT do it.
		// The ONLY exception is streaming.
		if (current !== 'streaming' && next === current) {
			return;
		}

		this.intake(op);
	}

	/**
	 *
	 * @param req
	 * @param cb
	 */
	fetch(req: Request, cb?: Subscriber) {
		const notify = () => {
			const state = this.stateMap.get(req.id) ?? 'idle';
			// FIXME: how to pass the data here?
			cb(state, null);
		};

		if (cb) {
			this.events.on(req.id, notify);
		}

		this.apply($fetch(req));

		return {
			cancel: () => {
				this.apply($cancel(req));
			},
			unsubscribe: () => {
				cb && this.events.off(req.id, notify);
			},
		};
	}
}
