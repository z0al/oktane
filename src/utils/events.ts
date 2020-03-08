// Ours
import { Request } from './request';

export const Fetch = (req: Request) => ({
	type: '@fetch',
	payload: { req },
});

export const Cancel = (req: Request) => ({
	type: '@cancel',
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

export const Cancelled = (req: Partial<Request>) => ({
	type: '@cancelled',
	payload: { req },
});

export const Completed = (req: Partial<Request>) => ({
	type: '@completed',
	payload: { req },
});

export type ClientEvent =
	| ReturnType<typeof Fetch>
	| ReturnType<typeof Cancel>;

export type WorkerEvent =
	| ReturnType<typeof Response>
	| ReturnType<typeof Failure>
	| ReturnType<typeof Cancelled>
	| ReturnType<typeof Completed>;

export type Event = ClientEvent | WorkerEvent;
