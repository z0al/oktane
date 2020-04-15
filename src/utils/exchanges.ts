// Packages
import invariant from 'tiny-invariant';

// Ours
import is from './is';
import { Cache } from './cache';
import { Operation } from './operations';

export type EmitFunc = (op: Operation) => void;

export interface ExchangeOptions {
	emit: EmitFunc;
	cache: Cache;
}

export interface Exchange {
	name: string;
	init: (o?: ExchangeOptions) => (next?: EmitFunc) => EmitFunc;
}

/**
 * Setups exchanges and returns emit function. This is very similar
 * to Redux's `applyMiddleware`.
 *
 * @param exchanges
 * @param options
 */
export const pipe = (
	exchanges: Exchange[],
	options: ExchangeOptions
): EmitFunc => {
	invariant(
		exchanges?.length > 0,
		'At least one exchange must be provided'
	);

	for (const ex of exchanges) {
		invariant(
			is.string(ex?.name),
			`exchange.name must be a non-empty string. Found: ${ex?.name}`
		);

		invariant(
			is.func(ex?.init),
			`exchange.init must be a function. Found: ${ex?.init}`
		);
	}

	// No duplicated names allowed
	const names = exchanges.map((e) => e.name);
	for (const name of names) {
		invariant(
			names.indexOf(name) === names.lastIndexOf(name),
			`exchange names must be unique. ` +
				`Found two or more exchanges with the name: ${name}`
		);
	}

	let emit: EmitFunc = () => {
		invariant(false, 'emitting during exchange setup is not allowed');
	};

	const api: ExchangeOptions = {
		...options,
		emit: (o) => emit(o),
	};

	emit = exchanges
		.map((ex) => ex.init(api))
		.reduce((a, b) => (o) => a(b(o)))(options.emit);

	return emit;
};
