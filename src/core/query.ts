// Packages
import { takeEvery, call, put } from 'redux-saga/effects';

// Ours
import * as actions from './actions';
import * as is from './internals/is';
import * as t from './internals/types';

type Action = ReturnType<typeof actions.queryFetch>;

export function* query(action: Action, handler: any) {
  const { query, args } = action.payload;

  const resolve = yield call(handler, query);

  // Resolve the query
  let result: t.QueryResult = {};
  try {
    result = yield call(resolve, args);
  } catch (error) {
    result.error = error;
  }

  let { data, error } = result;

  // An error occured
  if (is.defined(error)) {
    return yield put(actions.queryError(query, error));
  }

  if (!is.defined(data)) {
    return; // no-op
  }

  data = is.array(data) ? data : [data];
  yield put(actions.cacheAdd(query, data));
}

export default (handler: any) => {
  function* work(action: Action) {
    return query(action, handler);
  }

  return takeEvery(actions.QUERY_FETCH, work);
};
