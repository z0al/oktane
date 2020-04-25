// Ours
import is from './is';
import { Cache } from './cache';
import { Operation, $ } from './operations';

export type EmitFunc = (op: Operation) => Operation;

type ApplyFunc = typeof $;

export interface PluginOptions {
	apply: ApplyFunc;
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
	emit: EmitFunc,
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

	let apply: ApplyFunc = () => {
		throw new Error(
			'applying operations during plugin setup is not allowed'
		);
	};

	const api: PluginOptions = {
		cache,
		apply: (t, p, m) => apply(t, p, m),
	};

	emit = plugins
		.map((ex) => ex.init(api))
		.reduce((a, b) => (o) => a(b(o)))(emit);

	apply = (t, p, m) => {
		if (t === 'dispose') {
			throw new Error('manual requests disposal is not supported');
		}

		return emit($(t, p, m));
	};

	return emit;
};
