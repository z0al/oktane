// Ours
import { Request } from './request';

export const Fetch = (req: Request) => ({
	type: '@fetch',
	payload: { req },
});

export const Abort = (req: Request) => ({
	type: '@abort',
	payload: { req },
});

export const Respond = (req: Partial<Request>, data: any) => ({
	type: '@reponse',
	payload: { req, data },
});

export const Fail = (req: Partial<Request>, error: Error) => ({
	type: '@failed',
	payload: { req, error },
});

export const Complete = (req: Partial<Request>) => ({
	type: '@completed',
	payload: { req },
});

export type RequestEvent =
	| ReturnType<typeof Fetch>
	| ReturnType<typeof Abort>;

export type ResponseEvent =
	| ReturnType<typeof Respond>
	| ReturnType<typeof Complete>;

export type ErrorEvent = ReturnType<typeof Fail>;

export type EventType =
	| RequestEvent['type']
	| ErrorEvent['type']
	| ResponseEvent['type'];

export type Event = RequestEvent | ErrorEvent | ResponseEvent;
