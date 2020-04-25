// Ours
import { Status } from './status';

export type Result = { status: Status; data?: any; error?: any };
export type Cache = Pick<Map<string, Result>, 'get' | 'has'>;

export const exposeCache = (map: Map<string, Result>): Cache => {
	const get = (key: string) => {
		return map.get(key);
	};

	const has = (key: string) => {
		return map.has(key);
	};

	return { get, has };
};
