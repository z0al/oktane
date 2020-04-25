// Packages
import invariant from 'tiny-invariant';

// Ours
import is from './is';
import { Cache } from './cache';
import { Operation } from './operations';

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
	options: PluginOptions
): EmitFunc => {
	invariant(
		plugins?.length > 0,
		'At least one plugin must be provided'
	);

	for (const ex of plugins) {
		invariant(
			is.string(ex?.name),
			`plugin.name must be a non-empty string. Found: ${ex?.name}`
		);

		invariant(
			is.func(ex?.init),
			`plugin.init must be a function. Found: ${ex?.init}`
		);
	}

	// No duplicated names allowed
	const names = plugins.map((e) => e.name);
	for (const name of names) {
		invariant(
			names.indexOf(name) === names.lastIndexOf(name),
			`plugin names must be unique. ` +
				`Found two or more plugins with the name: ${name}`
		);
	}

	let emit: EmitFunc = () => {
		invariant(false, 'emitting during plugin setup is not allowed');
	};

	const api: PluginOptions = {
		...options,
		emit: (o) => emit(o),
	};

	emit = plugins
		.map((ex) => ex.init(api))
		.reduce((a, b) => (o) => a(b(o)))(options.emit);

	return emit;
};
