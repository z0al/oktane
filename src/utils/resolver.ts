// Ours
import { Request } from './request';

export type HandlerFunc = () => any | Promise<any>;

export type Resolver = (
	req: Request
) => HandlerFunc | Promise<HandlerFunc>;
