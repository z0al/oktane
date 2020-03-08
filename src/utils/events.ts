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

export const Response = (req: Partial<Request>, data: any) => ({
	type: '@response',
	payload: { req, data },
});

export const Failure = (req: Partial<Request>, error: Error) => ({
	type: '@failure',
	payload: { req, error },
});

export const Completed = (req: Partial<Request>) => ({
	type: '@completed',
	payload: { req },
});

export type ClientEvent =
	| ReturnType<typeof Fetch>
	| ReturnType<typeof Abort>;

export type WorkerEvent =
	| ReturnType<typeof Response>
	| ReturnType<typeof Completed>
	| ReturnType<typeof Failure>;

export type Event = ClientEvent | WorkerEvent;
