// Packages
import * as saga from 'redux-saga/effects';

// Ours
import runQuery from './query';
import * as act from '../actions';
import * as t from '../internals/types';

function init(resolver: t.QueryResolver) {
  return function*() {
    // Only listen to new requests since cancelation is
    // handled by internally by specific workers
    const triggers = [act.QUERY_FETCH];

    // Makes sure we don't miss any action no matter what
    const chan = yield saga.actionChannel(triggers);

    while (true) {
      const action: act.Action = yield saga.take(chan);

      // Get runner
      const { query } = action.payload;
      const runner = yield saga.call(resolver, query);

      if (action.type === act.QUERY_FETCH) {
        yield saga.spawn(runQuery, query, runner);
      }
    }
  };
}

export default init;
