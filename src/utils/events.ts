// Ours
import { Request, Response } from './request';

export type RequestEvent = {
	type: '@fetch' | '@abort';
	data: {
		req: Request;
	};
};

export type ErrorEvent = {
	type: '@failed';
	data: {
		req: Partial<Request>;
		error: Error;
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
	| ErrorEvent['type']
	| ResponseEvent['type']
	| CacheEvent['type'];

export type Event =
	| RequestEvent
	| ErrorEvent
	| ResponseEvent
	| CacheEvent;
