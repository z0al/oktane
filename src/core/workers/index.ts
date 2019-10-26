// Packages
import * as saga from 'redux-saga/effects';

// Ours
import * as act from '../actions';
import * as t from '../internals/types';
import resolveQuery from './query';

function* root(handler: t.QueryHandler) {
  // Only listen to new requests since cancelation is
  // handled by internally by specific workers
  const triggers = [act.QUERY_FETCH];

  // Makes sure we don't miss any action no matter what
  const chan = yield saga.actionChannel(triggers);

  while (true) {
    const action: act.Action = yield saga.take(chan);

    // Get resolver
    const { query } = action.payload;
    const resolver = yield saga.call(handler, query);

    if (action.type === act.QUERY_FETCH) {
      yield saga.spawn(resolveQuery, query, resolver);
    }
  }
}

export default root;
