// Ours
import { Request } from './request';

export interface Response {
	data?: any;
	request: Pick<Request, 'id' | 'type'>;
	done: boolean;
}
