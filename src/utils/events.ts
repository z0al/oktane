// Ours
import { Request } from './request';

// Requests

export type TaskEvent = {
	type: 'task/resolve';
	data: {
		req: Request;
	};
};

export type Event = TaskEvent;
