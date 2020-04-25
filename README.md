# Oktane

![npm package](https://badgen.net/npm/v/oktane)
![npm bundle size](https://badgen.net/bundlephobia/minzip/oktane)

Light-weight helpers for data fetching.

## Project status

Experimental. Expect breaking changes!

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
