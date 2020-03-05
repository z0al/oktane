// Ours
import { Request, Response } from './request';

export type RequestEvent = {
	type: '@fetch' | '@abort';
	payload: {
		req: Request;
	};
};

export type ErrorEvent = {
	type: '@failed';
	payload: {
		req: Partial<Request>;
		error: Error;
	};
};

export type ResponseEvent = {
	type: '@data';
	payload: {
		res: Response;
	};
};

export type CacheEvent = {
	type: '@cache/sync';
	payload: {
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
