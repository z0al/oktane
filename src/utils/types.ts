// Ours
import { Operation } from './operations';

export type EmitFunc = (op: Operation) => Operation;

export interface ExchangeOptions {
	emit: EmitFunc;
}

export interface Exchange {
	name: string;
	init: (o?: ExchangeOptions) => (next?: EmitFunc) => EmitFunc;
}
