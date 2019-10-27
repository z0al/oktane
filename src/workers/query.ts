// Packages
import is from 'is';
import * as saga from 'redux-saga/effects';

// Ours
import * as t from '../types';
import * as utils from './utils';
import * as actions from '../actions';
import * as select from '../selectors';

function* query(q: t.Query, run: t.QueryRunner, op: t.QueryOptions) {
  const { next } = yield saga.select(state =>
    select.savedQuery(state, q.__id)
  );

  const options = { next, args: op.args };

  try {
    const task = yield saga.race({
      result: saga.call(run, options),
      cancelled: saga.call(utils.cancel, q),
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
      const data: any = is.array(result.data)
        ? result.data
        : [result.data];

      yield saga.put(actions.queryDone(q, data, result.next));
    }
  } catch (error) {
    return yield saga.put(actions.queryError(q, error));
  }
}

export default query;
