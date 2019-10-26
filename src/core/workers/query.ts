// Packages
import * as saga from 'redux-saga/effects';

// Ours
import * as utils from './utils';
import * as actions from '../actions';
import * as is from '../internals/is';
import * as t from '../internals/types';

function* query(query: t.Query, resolver: t.QueryResolver) {
  try {
    const task = yield saga.race({
      result: saga.call(resolver, {}),
      cancelled: saga.call(utils.cancel, query),
    });

    if (task.cancelled) {
      return;
    }

    const result = task.result as t.QueryResult;
    if (is.defined(result.error)) {
      throw result.error;
    }

    // TODO: Maybe log a warning if result.data is not an object?
    if (is.object(result.data)) {
      yield saga.put(
        actions.cacheAdd(
          query,
          is.array(result.data) ? result.data : [result.data]
        )
      );
    }
  } catch (error) {
    return yield saga.put(actions.queryError(query, error));
  }
}

export default query;
