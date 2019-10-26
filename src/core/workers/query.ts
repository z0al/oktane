// Packages
import { call, put } from 'redux-saga/effects';

// Ours
import * as actions from '../actions';
import * as is from '../internals/is';
import * as t from '../internals/types';

function* query(query: t.Query, resolver: t.QueryResolver) {
  let result: t.QueryResult = {};

  try {
    result = yield call(resolver, {});
  } catch (error) {
    result.error = error;
  }

  let { data, error } = result;

  // An error occured
  if (is.defined(error)) {
    return yield put(actions.queryError(query, error));
  }

  if (!is.defined(data)) {
    // TODO: maybe log a warning?
    return; // no-op
  }

  data = is.array(data) ? data : [data];
  yield put(actions.cacheAdd(query, data));
}

export default query;
