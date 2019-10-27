// Packages
import * as saga from 'redux-saga/effects';

// Ours
import * as t from '../types';
import * as actions from '../actions';
import handleQuery from './query';

const workers: any = {
  query: handleQuery,
};

function init(resolver: t.QueryResolver) {
  // Only listen to new requests since cancelation is handled
  // internally by specific workers
  const pattern = [actions.QUERY_REQUEST];

  // Better complete. MUST be the same as those listed above
  type _Action = ReturnType<typeof actions.queryRequest>;

  return function*() {
    // Makes sure we don't miss any action no matter what!
    const chan = yield saga.actionChannel(pattern);

    while (true) {
      const action: _Action = yield saga.take(chan);

      // Get a runner
      const { query, options } = action.payload;
      const runner = yield saga.call(resolver, query);

      const worker = workers[options.type];
      yield saga.spawn(worker, query, runner, options);
    }
  };
}

export default init;
