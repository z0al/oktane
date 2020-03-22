// Ours
import { pipe } from './utils/pipe';
import { Request } from './request';
import { Emitter } from './utils/emitter';
import { transition, State } from './utils/state';
import { createFetch, FetchHandler } from './fetch';
import { Operation, $fetch, $cancel } from './utils/operations';
import { Exchange, EmitFunc, ExchangeOptions } from './utils/types';

export interface ClientOptions {
	handler: FetchHandler;
	exchanges?: Array<Exchange>;
}

export type Subscriber = (state: State, data: any, error?: any) => void;

export class Client {
	private intake: EmitFunc;
	private events = Emitter();
	private cacheMap = new Map<string, any>();
	private stateMap = new Map<string, State>();

	constructor(options: ClientOptions) {
		const exchanges = options.exchanges || [];
		const fetchExchange = createFetch(options.handler);

		// Setup exchanges
		const config: ExchangeOptions = {
			emit: this.emit.bind(this),
			cache: {
				...this.cacheMap,
				// @ts-ignore
				set: undefined,
				clear: undefined,
				delete: undefined,
			},
		};

		this.intake = pipe([...exchanges, fetchExchange], config);
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

		// Update cache if necessary
		if (op.type === 'buffer' || op.type === 'complete') {
			if (op.payload.data !== undefined) {
				this.cacheMap.set(key, op.payload.data);
			}
		}

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
		const notify = (op: Operation) => {
			const state = this.stateMap.get(req.id) || 'idle';
			const data = this.cacheMap.get(req.id);

			if (op.type === 'reject') {
				return cb(state, data, op.payload.error);
			}

			return cb(state, data);
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
