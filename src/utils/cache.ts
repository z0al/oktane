// Ours
import { State } from './state';

export type Result = { state: State; data?: any; error?: any };
export type Cache = Pick<Map<string, any>, 'get' | 'has'>;

export const mapToCache = (map: Map<string, Result>): Cache => {
	const get = (key: string) => {
		return map.get(key)?.data;
	};

	const has = (key: string) => {
		return map.has(key);
	};

	return { get, has };
};
