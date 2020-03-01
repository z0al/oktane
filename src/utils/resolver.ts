// Ours
import { Request } from './request';
import { Response } from './response';

export type ResolverFn = () => Response | Promise<Response>;

export type Resolver = (req: Request) => ResolverFn;
