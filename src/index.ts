// Ours
import init from './workers';
import reducer from './actions';
import * as t from './types';

export interface Options {
  resolver: t.QueryResolver;
}

export function createEngine({ resolver }: Options) {
  return { reducer, engine: init(resolver) };
}
