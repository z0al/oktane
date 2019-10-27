// Packages
import { channel } from 'redux-saga';
import * as saga from 'redux-saga/effects';

// Ours
import init from '..';
import runQuery from '../query';
import * as actions from '../../actions';

describe('root', () => {
  const query = { __id: 'RESOLVE_ME' };

  let resolver: any; // A mocked resolver
  let ch: any; // A mocked channel

  beforeEach(() => {
    resolver = jest.fn();
    ch = channel();
  });

  // List of allowed actions to listen to in the root worker
  const pattern = [actions.QUERY_REQUEST];

  it('creates an actionChannel', () => {
    const gen = init(resolver)();
    expect(gen.next().value).toEqual(saga.actionChannel(pattern));
  });

  it('listens to necessary actions', () => {
    const gen = init(resolver)();

    gen.next(); // create a channel
    expect(gen.next(ch).value).toEqual(saga.take(ch));
  });

  it('calls resolver to get a runner', () => {
    const action = actions.queryRequest(query, { type: 'query' });
    const gen = init(resolver)();

    gen.next(); // create a channel
    gen.next(ch); // listen to it
    expect(gen.next(action).value).toEqual(saga.call(resolver, query));
  });

  it('spawns an appropriate worker', () => {
    const action = actions.queryRequest(query, { type: 'query' });
    const gen = init(resolver)();
    const runner: any = jest.fn();

    gen.next(); // create a channel
    gen.next(ch); // listen to it
    gen.next(action); // get a runner
    expect(gen.next(runner).value).toEqual(
      saga.spawn(runQuery, query, runner, { type: 'query' })
    );
  });
});
