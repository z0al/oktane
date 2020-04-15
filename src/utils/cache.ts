// Ours
import { State } from './state';

export type Result = { state: State; data?: any; error?: any };

export type Subscriber = (change: Result) => void;

export type ReadonlyStore = ReadonlyMap<string, Result>;
export type Store = Map<string, Result>;
