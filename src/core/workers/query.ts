// Packages
import * as saga from 'redux-saga/effects';

// Ours
import * as actions from '../actions';
import * as is from '../internals/is';
import * as t from '../internals/types';

function* query(query: t.Query, resolver: t.QueryResolver) {
  let result: t.QueryResult = {};

  try {
    result = yield saga.call(resolver, {});
  } catch (error) {
    result.error = error;
  }

  let { data, error } = result;

  // An error occured
  if (is.defined(error)) {
    return yield saga.put(actions.queryError(query, error));
  }

  if (!is.defined(data)) {
    // TODO: maybe log a warning?
    return; // no-op
  }

  data = is.array(data) ? data : [data];
  yield saga.put(actions.cacheAdd(query, data));
}

export default query;
