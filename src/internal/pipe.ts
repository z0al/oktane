// Packages
import is from '@sindresorhus/is';
import invariant from 'tiny-invariant';

// Ours
import { Exchange, EmitFunc } from './types';

/**
 * Setups exchanges and returns emit function. This is very similar
 * to Redux's `applyMiddleware` but with the exception that it reduces
 * exchanges from left to right.
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
	emit: EmitFunc
): EmitFunc => {
	invariant(
		exchanges?.length > 0,
		'At least one exchange must be provided'
	);

	for (const ex of exchanges) {
		invariant(is.function_(ex), `exchange must be a function: ${ex}`);
	}

	let apply: EmitFunc = () => {
		invariant(false, 'emitting during exchange setup is not allowed');
	};

	const options = { emit: apply };
	apply = exchanges
		.map(ex => ex(options))
		.reduce((a, b) => o => b(a(o)))(emit);

	return apply;
};
