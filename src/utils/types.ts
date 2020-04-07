// Ours
import { Operation } from './operations';

export type EmitFunc = (op: Operation) => void;

export interface Cache {
	has(key: string): boolean;
	get(key: string): any;
	entries(): IterableIterator<[string, any]>;
	keys(): IterableIterator<string>;
	values(): IterableIterator<any>;
}

export interface ExchangeAPI {
	emit: EmitFunc;
	cache: Cache;
}

export interface Exchange {
	name: string;
	init: (o?: ExchangeAPI) => (next?: EmitFunc) => EmitFunc;
}
