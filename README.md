# Oktane

[![npm package](https://badgen.net/npm/v/oktane)][npm]
[![npm bundle size](https://badgen.net/bundlephobia/minzip/oktane@latest)][bundlephobia]

> **Current status:** 🚧 In alpha stage so expect breaking changes. Check out the [roadmap](https://github.com/z0al/oktane/issues/3) for more info.

A light-weight and customizable library for data fetching in React.

## Features

- 📦 Minimal footprint (< 3kb gzipped)
- 🌐 Backend agnostic
- 🧹 Automatic Garbage collection
- 🔫 Request cancellation
- ⏫ Parallel / Dependent Queries
- 🔃 Subscriptions / Lazy queries
- 🔌 Plugins support
- 💙 TypeScript ready
- [and more ...](./examples)

## Installation

> Requires React v16.8.6 or higher

```sh
npm add oktane
```

## Basic usage

[![Open in CodeSandbox][csb]][basic-demo]

### Creating the client

```javascript
import { createClient, ClientProvider } from 'oktane';

const client = createClient({
  fetch: ({ query }) => {
    return fetch(
      `https://jsonplaceholder.typicode.com/${query}`
    ).then((res) => res.json());
  },
});

const App = () => (
  <ClientProvider value={client}>
    <Todos />
  </ClientProvider>
);
```

### Fetching data

```javascript
import { useQuery } from 'oktane';

const Todos = () => {
  const { data, status } = useQuery('todos');

  if (status === 'pending') {
    return <p>loading ...</p>;
  }

  return (
    <>
      <h2>Todo list</h2>
      <ul>
        {data.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  );
};
```

## How it works

Many data fetching libraries provide multiple React hooks to support use cases e.g. `useSubscription`, `useInfiniteQuery` ..etc. To minimize the API surface Oktane takes a different approach.

Here how someone would make a request using the [useQuery](#usequery) hook provided by Oktane:

```javascript
const { data, error, hasMore, fetchMore, ...rest } = useQuery(/* query */);
```

> **Note:** [useRequest](#userequest) hook works the same way as `useQuery` expect it doesn't fetch the request automatically on mount/updates but rather exposes a helper to manually fetch when needed.

When resolving a request, Oktane checks the value returned by `clientOptions.fetch(request, ctx)` call and does one of the following based to the type:

- **Promise:** ([demo][basic-demo] )
  - Waits for the Promise to resolve and then set `data` to the result.
  - In the case of error, Oktane will catch the error and expose it as `error`.
  - Calling `hasMore` will always return false.
  - **Use case:** API Calls, loading data from LocalStorage ...etc.
- **Iterable / Async Iterable:**  ([demo][infinite-demo] )
  - Calls `iterator.next()` **once** and sets `data` to the result.
  - Next values can be emitted by calling `fetchMore`.
  - Calling `hasMore` will return true as long as the iterator doesn't complete.
  - In the case of error, Oktane will catch the error and expose it as `error`.
  - **Use case:** Infinite scroll.
- **Callback function:**  ([demo][subscription-demo] )
  - Assumes a function that accepts a subscriber and optionally returns a function to close subscription (i.e. unsubscribe).
  - Any value passed to `subscriber.next()` will be available as `data`.
  - Calling `subscriber.error()` will set the value to `error` and close the subscription.
  - Calling `subscriber.complete()` will mark the request as completed and close the subscription.
  - Calling `hasMore` will always return false.
  - **Use case:** Anything you would use an Observable for e.g. Web Socket.
- **Anything else:** wraps it in `Promise.resolve` and applies the Promise rule above.

It's worth mentioning that custom plugins may alter the behavior described above. For example, a plugin may decide not to report errors back to the React hook and instead retry the request every time it fails.

### API

#### createClient

```javascript
function createClient(options: ClientOptions): Client
```

**Arguments**

- **options (object)**
  - **fetch (function):** The function that resolves all requests. **Required**.
  - **plugins (array):** An array of custom plugins.
  - **cache (object)**
    - **disposeTime (number):** A timeout for unused requests. Default is 30 seconds.

#### useQuery

```javascript
function useQuery(query: QueryFunc  | any): {
  cancel: () => void;
  refetch: () => void;
  hasMore: () => boolean;
  fetchMore: () => void;
}
```

#### useRequest

```javascript
function useRequest(query: any): {
  fetch: () => void;
  cancel: () => void;
  refetch: () => void;
  hasMore: () => boolean;
  fetchMore: () => void;
}
```

## Examples

Check out the [examples](./examples) folder.

## Credits

Inspired by the following great libraries:

- [Redux][redux]: Predictable state container for JavaScript apps.
- [SWR][swr]: React Hooks library for remote data fetching.
- [React Query][react-query]: Hooks for fetching, caching, and updating asynchronous data in React.

## License

MIT © Ahmed T. Ali

[npm]: https://npm.im/oktane
[bundlephobia]: https://bundlephobia.com/result?p=oktane@latest
[redux]: https://github.com/reduxjs/redux
[swr]: https://github.com/zeit/swr
[react-query]: https://github.com/tannerlinsley/react-query/
[csb]: https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox
[basic-demo]: https://codesandbox.io/s/github/z0al/oktane/tree/master/examples/basic
[infinite-demo]: https://codesandbox.io/s/github/z0al/oktane/tree/master/examples/infinite
[subscription-demo]: https://codesandbox.io/s/github/z0al/oktane/tree/master/examples/subscription

