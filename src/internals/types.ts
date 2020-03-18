// Ours
import { Operation } from './operations';

export type EmitFunc = (op: Operation) => Operation;

export interface ExchangeOptions {
	emit: EmitFunc;
}

export type Exchange = (
	o?: ExchangeOptions
) => (next?: EmitFunc) => EmitFunc;
