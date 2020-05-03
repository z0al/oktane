// Ours
import is from '../utils/is';
import { Cache } from '../utils/cache';
import { Operation } from '../utils/operations';

export type EmitFunc = (op: Operation) => Operation;

export interface PluginOptions {
	emit: EmitFunc;
	cache: Cache;
}

export interface Plugin {
	name: string;
	init: (o?: PluginOptions) => (next?: EmitFunc) => EmitFunc;
}

/**
 * Setups plugins and returns emit function. This is very similar
 * to Redux's `applyMiddleware`.
 *
 * @param plugins
 * @param options
 */
export const pipe = (
	plugins: Plugin[],
	apply: EmitFunc,
	cache: Cache
): EmitFunc => {
	if (__DEV__) {
		for (const ex of plugins) {
			if (!is.string(ex?.name)) {
				throw new Error(
					`plugin.name must be a non-empty string. Found: ${ex?.name}`
				);
			}

			if (!is.func(ex?.init)) {
				throw new Error(
					`plugin.init must be a function. Found: ${ex?.init}`
				);
			}
		}

		// No duplicated names allowed
		const names = plugins.map((e) => e.name);
		for (const name of names) {
			if (names.indexOf(name) !== names.lastIndexOf(name)) {
				throw new Error(
					`plugin names must be unique. ` +
						`Found two or more plugins with the name: ${name}`
				);
			}
		}
	}

	let emitInsidePlugins: EmitFunc = () => {
		throw new Error('Emitting during plugin setup is not allowed');
	};

	const emit = plugins
		.map((ex) =>
			ex.init({
				cache,
				emit: (op) => emitInsidePlugins(op),
			})
		)
		.reduce((a, b) => (o) => a(b(o)))(apply);

	emitInsidePlugins = (op) => {
		if (op.type === 'dispose') {
			throw new Error(
				'disposing queries inside plugins is not supported'
			);
		}

		return emit(op);
	};

	return emit;
};
