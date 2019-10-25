// Packages
import { call, put } from 'redux-saga/effects';

// Ours
import { query } from '../query';
import * as actions from '../actions';

globalThis.__DEV__ = true;

describe('query', () => {
  const q = { id: 'MY_QUERY' };
  const act = actions.queryFetch(q);
  const actWithArgs = actions.queryFetch(q, { MyArg: true });

  let handler: any, resolver: any;
  beforeEach(() => {
    resolver = jest.fn();
    handler = jest.fn();
  });

  it('calls the handler with query', () => {
    let gen = query(act, handler);
    expect(gen.next().value).toEqual(call(handler, q));
    expect(gen.next(resolver).value).toEqual(
      call(resolver, act.payload.args)
    );

    gen = query(actWithArgs, handler);
    expect(gen.next().value).toEqual(call(handler, q));
    expect(gen.next(resolver).value).toEqual(
      call(resolver, actWithArgs.payload.args)
    );
  });

  it('tiggers error action in case of error', () => {
    let gen = query(act, handler);

    gen.next(); // calling handler
    gen.next(resolver); // calling resolver
    expect(gen.next({ error: 'FAIL' }).value).toEqual(
      put(actions.queryError(q, 'FAIL'))
    );
  });

  it('catches unhandled errors', () => {
    let gen = query(act, handler);
    let err = new Error('FAIL');

    gen.next(); // calling handler
    gen.next(resolver); // calling resolver
    expect(gen.throw(err).value).toEqual(
      put(actions.queryError(q, err))
    );
  });

  it('adds data to cache', () => {
    let gen = query(act, handler);

    gen.next(); // calling handler
    gen.next(resolver); // calling resolver
    expect(gen.next({ data: { id: 1 } }).value).toEqual(
      put(actions.cacheAdd(q, [{ id: 1 }]))
    );
  });
});
