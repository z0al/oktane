// Ours
import * as t from '../types';
import { createAction } from '../utils/createAction';

export const QUERY_REQUEST = 'query/request';
export const queryRequest = createAction(
  QUERY_REQUEST,
  (query: t.Query, options: t.QueryOptions) => {
    return { payload: { query, options } };
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
  (query: t.Query, options: t.QueryOptions) => {
    return { payload: { query, options } };
  }
);

export const QUERY_DATA = 'query/data';
export const queryData = createAction(
  QUERY_DATA,
  (query: t.Query, data: t.DataObject[], next: any) => {
    return { payload: { query, data, next } };
  }
);

export const QUERY_DONE = 'query/done';
export const queryDone = createAction(
  QUERY_DONE,
  (query: t.Query, data: t.DataObject[], next: any) => {
    return { payload: { query, data, next } };
  }
);

export type Action =
  | ReturnType<typeof queryRequest>
  | ReturnType<typeof queryError>
  | ReturnType<typeof queryCancel>
  | ReturnType<typeof queryData>
  | ReturnType<typeof queryDone>;
