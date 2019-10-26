// Packages
import * as saga from 'redux-saga/effects';

// Ours
import * as utils from './utils';
import * as actions from '../actions';
import * as is from '../internals/is';
import * as select from '../selectors';
import * as t from '../internals/types';

function* query(query: t.Query, resolver: t.QueryResolver) {
  const { next } = yield saga.select(state =>
    select.queryData(state, query.id)
  );

  const options = { next };

  try {
    const task = yield saga.race({
      result: saga.call(resolver, options),
      cancelled: saga.call(utils.cancel, query),
    });

    if (task.cancelled) {
      return;
    }

    const result = task.result as t.QueryResult;
    if (is.defined(result.error)) {
      throw result.error;
    }

    // TODO: Maybe log a warning if result.data is not defined?
    if (is.defined(result.data)) {
      yield saga.put(
        actions.queryResult(
          query,
          is.array(result.data) ? result.data : [result.data],
          result.next
        )
      );
    }
  } catch (error) {
    return yield saga.put(actions.queryError(query, error));
  }
}

export default query;
