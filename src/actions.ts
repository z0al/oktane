// Ours
import * as t from './internals/types';
import { createAction } from './internals/createAction';

export const QUERY_FETCH = 'query/fetch';
export const queryFetch = createAction(
  QUERY_FETCH,
  (query: t.Query) => {
    return { payload: { query } };
  }
);

export const QUERY_ERROR = 'query/error';
export const queryError = createAction(
  QUERY_ERROR,
  (query: t.Query, error: any) => {
    return { payload: { query, error } };
  }
);

export const QUERY_CANCEL = 'query/cancel';
export const queryCancel = createAction(
  QUERY_CANCEL,
  (query: t.Query) => {
    return { payload: { query } };
  }
);

export const QUERY_RESULT = 'query/result';
export const queryResult = createAction(
  QUERY_RESULT,
  (query: t.Query, data: t.DataObject[], next: any) => {
    return { payload: { query, data, next } };
  }
);

export type Action =
  | ReturnType<typeof queryFetch>
  | ReturnType<typeof queryError>
  | ReturnType<typeof queryCancel>
  | ReturnType<typeof queryResult>;
