// Packages
import { channel } from 'redux-saga';
import * as saga from 'redux-saga/effects';

// Ours
import worker from '..';
import * as actions from '../../actions';
import resolveQuery from '../query';

describe('root', () => {
  const query = { id: 'RESOLVE_ME' };

  let handler: any; // A mocked handler
  let ch: any; // A mocked channel

  beforeEach(() => {
    handler = jest.fn();
    ch = channel();
  });

  // List of allowed actions to listen to in the root worker
  const allowed = [actions.QUERY_FETCH];

  it('creates an actionChannel', () => {
    const gen = worker(handler);
    expect(gen.next().value).toEqual(saga.actionChannel(allowed));
  });

  it('listens to necessary actions', () => {
    const gen = worker(handler);

    gen.next(); // create a channel
    expect(gen.next(ch).value).toEqual(saga.take(ch));
  });

  it('gets a resolver from the handler', () => {
    const action = actions.queryFetch(query);
    const gen = worker(handler);

    gen.next(); // create a channel
    gen.next(ch); // listen to it
    expect(gen.next(action).value).toEqual(saga.call(handler, query));
  });

  it('spawns an appropriate worker', () => {
    const action = actions.queryFetch(query);
    const gen = worker(handler);
    const resolver: any = jest.fn();

    gen.next(); // create a channel
    gen.next(ch); // listen to it
    gen.next(action); // get a resolver
    expect(gen.next(resolver).value).toEqual(
      saga.spawn(resolveQuery, query, resolver)
    );
  });
});
