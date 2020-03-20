// Ours
import { Operation } from './operations';

export type EmitFunc = (op: Operation) => Operation | void;

export interface ExchangeOptions {
	emit: EmitFunc;
}

export interface Exchange {
	name: string;
	init: (o?: ExchangeOptions) => (next?: EmitFunc) => EmitFunc;
}
