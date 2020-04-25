# Oktane

![npm package](https://badgen.net/npm/v/oktane)
![npm bundle size](https://badgen.net/bundlephobia/minzip/oktane)

A light-weight and customizable library for data fetching in React.

## Project status

Experimental 🚧. Expect breaking changes!

## Installation

> Requires React v16.8.6 or higher

```sh
npm add oktane
```

## Basic usage

[![Open in CodeSandbox][csb]][example]

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

## Examples

Check out the [examples](./examples) folder.

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
[csb]: https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox
[example]: https://codesandbox.io/s/github/z0al/oktane/tree/master/examples/basic
