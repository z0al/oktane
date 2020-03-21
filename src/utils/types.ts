// Ours
import { Operation } from './operations';

export type EmitFunc = (op: Operation) => void;

export interface ExchangeOptions {
	emit: EmitFunc;
}

export interface Exchange {
	name: string;
	init: (o?: ExchangeOptions) => (next?: EmitFunc) => EmitFunc;
}
