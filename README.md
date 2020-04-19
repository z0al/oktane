# @z0al/ql

![npm package](https://badgen.net/npm/v/@z0al/ql)
![npm bundle size](https://badgen.net/bundlephobia/minzip/@z0al/ql)

Lightweight helpers for data fetching in React apps.

## Philosophy

- **📦 Minimal:** both API surface & package size.
- **🔃 Stream-First:** treat every response as a Stream.
- **🌍 Backend agnostic:** assume nothing about how the request will get resolved.
- **🔌 Extensible:** it should be easy to extend the default behavior to adopt different patterns.

## Features

- Protocol & Backend agnostic data fetching
- Works with Promises, Observables, iterators, .. etc
- Automatic Caching & Garbage Collection
- Request cancellation & refetching
- Pagination & Infinite loading
- Manual Requests
- Prefetching support
- TypeScript ready!

## Quick start

### Installation

> Requires React v16.8.6 or higher

```sh
npm add @z0al/ql
```

### Usage

```javascript
import { createClient, ClientProvider, useFetch } from '@z0al/ql';

const client = createClient({
  fetch: async (request) => {
    // handle request(s) here and return value
    if (request.body === 'hello') {
      return 'Hello world!';
    }
  },
});

const App = () => {
  return (
    <ClientProvider value={client}>
      <Hello />
    </ClientProvider>
  );
};

const Hello = () => {
  // useFetch accepts an object with any key and it will be
  // passed to the fetch function you provided for createClient
  const { data, status } = useFetch('hello');

  if (status === 'pending') {
    return <p>loading ...</p>;
  }

  return <p>{data}</p>; // displays "Hello world!"
};
```

## API

#### Table of Contents

- [createClient](#createclient)
- [hooks](#hooks)
  - [useFetch](#usefetch)
  - [useRequest](#userequest)
  - [useClient](#useclient)

### createClient

TODO

### Hooks

#### useFetch

TODO

#### useRequest

TODO

#### useClient

TODO

## Prior Art

Inspired by the following great libraries:

- [Redux][redux]: Predictable state container for JavaScript apps.
- [URQL][urql]: A highly customisable and versatile GraphQL client.
- [SWR][swr]: React Hooks library for remote data fetching.
- [React Query][react-query]: Hooks for fetching, caching and updating asynchronous data in React.

## License

MIT © Ahmed T. Ali

[redux]: https://github.com/reduxjs/redux
[urql]: https://github.com/FormidableLabs/urql
[swr]: https://github.com/zeit/swr
[react-query]: https://github.com/tannerlinsley/react-query/
