// Ours
import init from './workers';
import reducer from './reducers';
import * as t from './internals/types';

export interface Options {
  resolver: t.QueryResolver;
}

export function createEngine({ resolver }: Options) {
  return { reducer, engine: init(resolver) };
}
