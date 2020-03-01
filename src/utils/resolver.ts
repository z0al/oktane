// Ours
import { Request } from './request';

export type ResolverFn = () => any | Promise<any>;

export type Resolver = (req: Request) => ResolverFn;
