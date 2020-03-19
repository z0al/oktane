// Packages
import is from '@sindresorhus/is';
import invariant from 'tiny-invariant';

// Ours
import { Exchange, ExchangeOptions, EmitFunc } from './types';

/**
 * Setups exchanges and returns emit function. This is very similar
 * to Redux's `applyMiddleware`.
 *
 * @example
 * const ex1 = ()=> next => op => {
 * 	console.log('exchange 1')
 *  return next(op)
 * }

 * const ex2 = ()=> next => op => {
 * 	console.log('exchange 2')
 *  return next(op)
 * }
 *
 * const emit = op => console.log('emitted')
 *
 * let apply = compose([ex1,ext1], emit)
 * apply({type: 'fetch', ...others})
 * // should log:
 * // exchange 1
 * // exchange 2
 * // emitted
 *
 * @param exchanges
 * @param emit
 */
export const pipe = (
	exchanges: Exchange[],
	options: ExchangeOptions
): EmitFunc => {
	invariant(
		exchanges?.length > 0,
		'At least one exchange must be provided'
	);

	// Ensure valid exchanges (top-level only)
	for (const ex of exchanges) {
		invariant(
			is.string(ex?.name),
			`exchange.name must be a non-empty string. Found: ${ex?.name}`
		);

		invariant(
			is.function_(ex?.init),
			`exchange.init must be a function. Found: ${ex?.init}`
		);
	}

	// No duplicated names allowed
	const names = exchanges.map(e => e.name);
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

	emit = exchanges
		.map(ex => ex.init({ ...options, emit }))
		.reduce((a, b) => o => a(b(o)))(options.emit);

	return emit;
};
