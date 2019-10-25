> **Status:** This is pretty much experimental at the moment and I haven't figured out everything yet. If you want to discuss this feel free to reach me on [Twitter][twitter] or just open an [issue][issue] here.

# AnyQL (codename)

Abstract helpers for data-driven JavaScript apps inspired by [Apollo Client][apollo] built on the top of [redux-saga][saga].

## Design

### Principles

- Query language and view layer agnostic.
- Convention over configuration

### Non-goals

- Compatibility (or competing) with Apollo client/Relay.
- Specific Query Language support (e.g. GraphQL).

## Roadmap

- [ ] Basic query support with loading
- [ ] Handle query errors
- [ ] Support cancelation
- [ ] Support pagination
- [ ] Cache normalization
- [ ] Add cache helpers (get by ID, invalidate ..etc)
- [ ] Support mutations (i.e. write queries)
- [ ] Support subscriptions (i.e. streaming data)
- [ ] Anything missing? Open an issue.

## License

MIT (c) Ahmed T. Ali

[apollo]: https://www.apollographql.com/docs/react/
[issue]: https://github.com/z0al/anyql/issues
[redux]: https://redux.js.org
[saga]: https://redux-saga.js.org
[twitter]: https://twitter.com/_z0al
