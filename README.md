> **Warning:** This is pretty much experimental at the moment and I haven't figured out everything yet. If you want to discuss this (or share feedback) feel free to reach me on [Twitter][twitter] or just open an [issue][issue] here.

# AnyQL (codename)

Abstract helpers for data-driven JavaScript apps built on the top of [Redux Saga][saga].

## Features

* Idiomatic Redux
* Query language agnostic
* Out of the box support: Pagination, and cancellation
* Powered by Redux Saga

## Out of scope

- Compatibility (or competing) with Apollo client (or similar library)
- Specific Query Language support (e.g. GraphQL)

## Roadmap

- [x] Basic query support (share your [feedback][basic-query])
	- [x] Resolving queries
	- [x] Loading indication
	- [x] Handling query errors
	- [x] Cancellation support
	- [x] Pagination support
- [ ] React binding (WIP)
- [ ] Add cache helpers (get by ID, invalidate ..etc)
- [ ] Support mutations (i.e. write queries)
- [ ] Support streaming
- [ ] TBD. Have something? Open an [issue][issue]

## Documentation

TODO.

## Acknowledgments

This project wouldn't have been possible without the following great libraries:

* [React][react]: For all the hooks and re-rendering
* [Redux][redux]: For not once complaining about how many Todo apps it witnessed
* [Redux Saga][saga]: For helping us avoid the pain of forking [nocode][nocode]
* [TSDX][tsdx]: For making dealing with TypeScript no implicit any

Also, a special thanks to Apollo's team for their amazing work on [Apollo Client][apollo] from which we copied some concepts.

## License

MIT © Ahmed T. Ali

[apollo]: https://www.apollographql.com/docs/react/
[issue]: https://github.com/z0al/anyql/issues
[nocode]: https://github.com/kelseyhightower/nocode
[react]: https://reactjs.org/
[redux]: https://redux.js.org
[saga]: https://redux-saga.js.org
[twitter]: https://twitter.com/_z0al
[tsdx]: https://github.com/jaredpalmer/tsdx
[basic-query]: https://github.com/z0al/anyql/issues/1
