// Ours
import * as t from './internals/types';
import { createAction } from './internals/createAction';

export const QUERY_FETCH = 'query/fetch';
export const queryFetch = createAction(
  QUERY_FETCH,
  (query: t.Query, args?: t.QueryArgs) => {
    return { payload: { query, args } };
  }
);

export const QUERY_ERROR = 'query/error';
export const queryError = createAction(
  QUERY_ERROR,
  (query: t.Query, error?: any) => {
    return { payload: { query, error } };
  }
);

export const CACHE_ADD = 'cache/add';
export const cacheAdd = createAction(
  CACHE_ADD,
  (query: t.Query, data: t.DataObject[]) => {
    return { payload: { query, data } };
  }
);

export type Action =
  | ReturnType<typeof queryFetch>
  | ReturnType<typeof queryError>
  | ReturnType<typeof cacheAdd>;
