# Oktane

![npm package](https://badgen.net/npm/v/oktane)
![npm bundle size](https://badgen.net/bundlephobia/minzip/oktane)

A light-weight and customizable library for data fetching in React.

## Project status

Experimental 🚧. Expect breaking changes!

## Quick start

### Installation

> Requires React v16.8.6 or higher

```sh
npm add oktane
```

### Creating the client

```javascript
import { createClient, ClientProvider } from 'oktane';

const fetch = (request) => {
	return 'Hello world!';
};

const client = createClient({ fetch });

const App = () => (
	<ClientProvider value={client}>
		<Hello />
	</ClientProvider>
);
```

### Fetching data

```javascript
import { useFetch } from 'oktane';

const Hello = () => {
	const { data, status } = useFetch('hello');

	if (status === 'pending') {
		return <p>loading ...</p>;
	}

	return <p>{data}</p>;
};
```

## Credits

Inspired by the following great libraries:

- [Redux][redux]: Predictable state container for JavaScript apps.
- [SWR][swr]: React Hooks library for remote data fetching.
- [React Query][react-query]: Hooks for fetching, caching and updating asynchronous data in React.

## License

MIT © Ahmed T. Ali

[redux]: https://github.com/reduxjs/redux
[swr]: https://github.com/zeit/swr
[react-query]: https://github.com/tannerlinsley/react-query/
