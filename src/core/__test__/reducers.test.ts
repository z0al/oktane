// Ours
import reducer from '../reducers';
import * as actions from '../actions';

describe('reducer/queries', () => {
  it('returns default state', () => {
    const act = { type: 'ACT' };
    expect(reducer(undefined, act).queries).toEqual({});
  });

  it(`${actions.QUERY_FETCH}:sets loading, type`, () => {
    const query = { id: 'MY_QUERY' };
    const act = actions.queryFetch(query);

    const stateOne = reducer(undefined, act);
    const stateTwo = reducer(
      {
        queries: {
          [query.id]: {
            loading: false,
          },
        },
      } as any,
      act
    );

    const output = {
      [query.id]: {
        loading: true,
        dataIds: [],
        type: 'query',
      },
    };

    expect(stateOne.queries).toEqual(output);
    expect(stateTwo.queries).toEqual(output);
  });

  it(`${actions.QUERY_ERROR}: sets error and loading`, () => {
    const query = { id: 'MY_QUERY' };
    const act = actions.queryError(query, 'MY ERROR');

    const stateOne = reducer(undefined, act);
    const stateTwo = reducer(
      {
        queries: {
          [query.id]: {
            error: true,
            loading: true,
          },
        },
      } as any,
      act
    );

    const output = {
      [query.id]: {
        loading: false,
        error: 'MY ERROR',
      },
    };
    expect(stateOne.queries).toEqual(output);
    expect(stateTwo.queries).toEqual(output);
  });

  it(`${actions.CACHE_ADD}: sets dataIds and loading`, () => {
    const query = { id: 'MY_QUERY' };
    const act = actions.cacheAdd(query, [{ id: 1 }, { id: 2 }]);

    const stateOne = reducer(undefined, act);
    const stateTwo = reducer(
      {
        queries: {
          [query.id]: {
            loading: true,
            dataIds: [1, 3],
          },
        },
      } as any,
      act
    );

    expect(stateOne.queries).toEqual({
      [query.id]: {
        loading: false,
        dataIds: [1, 2],
      },
    });

    expect(stateTwo.queries).toEqual({
      [query.id]: {
        loading: false,
        dataIds: [1, 2, 3],
      },
    });
  });
});
