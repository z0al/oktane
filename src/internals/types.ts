// Ours
import { Operation } from './operations';

export type EmitFunc = (op: Operation) => void;

export interface PluginOptions {
	emit: EmitFunc;
}

export type Plugin = (
	o?: PluginOptions
) => (next?: EmitFunc) => EmitFunc;
