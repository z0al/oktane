// Ours
import reducer from '../reducers';
import * as actions from '../actions';

describe('root', () => {
  const act = { type: 'undefined' };
  it('sets initial state', () => {
    expect(reducer(undefined, act).queries).toEqual({});
  });
});

describe(actions.QUERY_FETCH, () => {
  const query = { id: 'fetch-me' };
  const fetch = actions.queryFetch(query);

  it('sets loading to true', () => {
    const state = reducer(undefined, fetch);
    expect(state.queries).toEqual({
      [query.id]: expect.objectContaining({
        loading: true,
      }),
    });
  });

  it('sets other query metadata', () => {
    const state = reducer(undefined, fetch);
    expect(state.queries).toEqual({
      [query.id]: expect.objectContaining({
        id: query.id,
        type: 'query',
        dataIds: [],
      }),
    });
  });
});

describe(actions.QUERY_ERROR, () => {
  const query = { id: 'fetch-me' };
  const error = new Error('FAIL');
  const fail = actions.queryError(query, error);

  it('sets loading to false', () => {
    const state = reducer(undefined, fail);
    expect(state.queries).toEqual({
      [query.id]: expect.objectContaining({
        loading: false,
      }),
    });
  });

  it('sets other query metadata', () => {
    const state = reducer(undefined, fail);
    expect(state.queries).toEqual({
      [query.id]: expect.objectContaining({
        error,
      }),
    });
  });
});

describe(actions.QUERY_RESULT, () => {
  const query = { id: 'fetch-me' };
  const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const add = actions.queryResult(query, data, 'NEXT');

  it('sets loading to false', () => {
    const state = reducer(undefined, add);
    expect(state.queries).toEqual({
      [query.id]: expect.objectContaining({
        loading: false,
        next: 'NEXT',
      }),
    });
  });

  it('appends ids to dataIds', () => {
    let state = reducer(undefined, add);
    expect(state.queries).toEqual({
      [query.id]: expect.objectContaining({
        dataIds: [1, 2, 3],
      }),
    });

    const preload = {
      queries: {
        [query.id]: {
          dataIds: [1, 4],
        },
      },
    };

    state = reducer(preload as any, add);
    expect(state.queries).toEqual({
      [query.id]: expect.objectContaining({
        dataIds: [1, 2, 3, 4],
      }),
    });
  });
});
