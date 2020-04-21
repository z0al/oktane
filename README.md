# Oktane

![npm package](https://badgen.net/npm/v/oktane)
![npm bundle size](https://badgen.net/bundlephobia/minzip/oktane)

Lightweight helpers for data fetching in React apps.

## Philosophy

- **📦 Minimal:** both API surface & package size.
- **🔃 Stream First:** treat every response as a Stream.
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
npm add oktane
```

### Usage

```javascript
import { createClient, ClientProvider, useFetch } from 'oktane';

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
	// Anything you pass to useFetch will form the request.body later
	const { data, status } = useFetch('hello');

	if (status === 'pending') {
		return <p>loading ...</p>;
	}

	return <p>{data}</p>; // displays "Hello world!"
};
```

## Concepts

Let's define some terms first:

### Request

An object with ID & body properies. We use the Requet's ID for deduping requests and also to link back result(s) to the correct request. We don't care about the shape of the Request's body.

### Streams

Every Request in Oktane returns a Stream. A Stream is just an abstraction for a source that returns value(s) over time. Here is how Oktane treats the return value of the fetch function:

- **Obervable (a.k.a Push Stream):** subscribes to the observable and saves emitted values to cache.

* **Callback function (a.k.a. Pull Streams):** calls the callback once (expecting to receive a value), save it to cache and then waits for the app to call `fetchMore`. Calling `fetchMore` will result in the callback (not the fetch function) being called again and again until it returns `{done: true}` similar to how Iterators/Generators work.

* **Promise/anything else:** waits for the promise to resolve and save the result to the cache.

### Operations

An Operation is an action that can be applied to a request at given time. An Operation can be: fetch, cancel, dispose, ...etc.

### Exchanges

Think of them as Redux's Middlewares, but with Operations instead of Redux Actions. An Exchange can provide functionalities like: autmatically retry failed requests, Long-polling, DevTools ...etc.

## API

> Work in progress

Currently this packages exposes the followings:

- **createClient:** a function used to create a new Client that can be used (via e.g `useFetch` or `useRequest` or directly using `client.prefetch`) to fetch & subscribe to requests.

- **useFetch:** a React hook that accepts Request's body and then fetches the Request if necessary. It supports passing a function to determine whether a Request is ready to be fetch or not.

- **useRequest:** same as `useFetch` but for manual Requests.

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
