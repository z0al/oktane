// Ours
import { Operation } from './operations';

// Exchanges

export type EmitFunc = (op: Operation) => void;

export interface ExchangeOptions {
	emit: EmitFunc;
	store: ReadonlyStore;
}

export interface Exchange {
	name: string;
	init: (o?: ExchangeOptions) => (next?: EmitFunc) => EmitFunc;
}

// Fetch
export interface Request {
	id: string;
	type?: never;
	[x: string]: any;
}

export type State =
	| 'ready'
	| 'pending'
	| 'failed'
	| 'buffering'
	| 'cancelled'
	| 'completed'
	| 'disposed';

export type FetchHandler = (
	request: Request,
	ctx?: {
		store: ReadonlyStore;
	}
) => any;

export type Subscriber = (state: State, data: any, err?: any) => void;

// Client
export interface ClientOptions {
	handler: FetchHandler;
	store?: {
		// Max age for unused requests. Default is 30 seconds.
		maxAge?: number;
	};
	exchanges?: Array<Exchange>;
}

export type ReadonlyStore = ReadonlyMap<
	string,
	{ state: State; data?: any }
>;
export type Store = Map<string, { state: State; data?: any }>;
