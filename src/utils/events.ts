// Ours
import { Request } from './request';
import { Response } from './response';

export type RequestEvent = {
	type: '@fetch' | '@abort';
	data: {
		req: Request;
	};
};

export type ResponseEvent = {
	type: '@data';
	data: {
		res: Response;
	};
};

export type CacheEvent = {
	type: '@cache/sync';
	data: {
		changes: any[];
	};
};

export type EventType =
	| RequestEvent['type']
	| ResponseEvent['type']
	| CacheEvent['type'];

export type Event = RequestEvent | ResponseEvent | CacheEvent;
