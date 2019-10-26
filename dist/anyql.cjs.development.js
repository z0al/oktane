'use strict';

var saga = require('redux-saga/effects');
var redux = require('redux');
var reselect = require('reselect');

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function createAction(type, prepareAction) {
  function actionCreator() {
    if (prepareAction) {
      var prepared = prepareAction.apply(void 0, arguments);

      if (!prepared) {
        throw new Error('prepareAction did not return an object');
      }

      return _extends({
        type: type,
        payload: prepared.payload
      }, 'meta' in prepared && {
        meta: prepared.meta
      }, {}, 'error' in prepared && {
        error: prepared.error
      });
    }

    return {
      type: type,
      payload: arguments.length <= 0 ? undefined : arguments[0]
    };
  }

  actionCreator.toString = function () {
    return "" + type;
  };

  actionCreator.type = type;
  return actionCreator;
}

var QUERY_FETCH = 'query/fetch';
var QUERY_ERROR = 'query/error';
var queryError =
/*#__PURE__*/
createAction(QUERY_ERROR, function (query, error) {
  return {
    payload: {
      query: query,
      error: error
    }
  };
});
var QUERY_CANCEL = 'query/cancel';
var QUERY_RESULT = 'query/result';
var queryResult =
/*#__PURE__*/
createAction(QUERY_RESULT, function (query, data, next) {
  return {
    payload: {
      query: query,
      data: data,
      next: next
    }
  };
});

var _marked =
/*#__PURE__*/
regeneratorRuntime.mark(cancel);
function cancel(query) {
  var actions, _ref, payload;

  return regeneratorRuntime.wrap(function cancel$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          actions = [QUERY_CANCEL];

        case 1:

          _context.next = 4;
          return saga.take(actions);

        case 4:
          _ref = _context.sent;
          payload = _ref.payload;

          if (!(payload.query.id === query.id)) {
            _context.next = 10;
            break;
          }

          _context.next = 9;
          return true;

        case 9:
          return _context.abrupt("return", _context.sent);

        case 10:
          _context.next = 1;
          break;

        case 12:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

function defined(o) {
  return typeof o !== 'undefined';
}
var array = Array.isArray;

function queries(state, act) {
  if (state === void 0) {
    state = {};
  }

  switch (act.type) {
    // query/fetch
    //
    // * Set query type
    // * Set loading to true
    // * Make sure dataIds is an array
    //
    // TODO: the query type should always be the same between calls
    case QUERY_FETCH:
      {
        var _extends2;

        var query = act.payload.query;
        var obj = _extends({}, state[query.id]) || {};
        obj.id = query.id;
        obj.loading = true;
        obj.type = query.type || 'query'; // Make sure .dataIds is an array

        if (!array(obj.dataIds)) {
          obj.dataIds = [];
        }

        return _extends({}, state, (_extends2 = {}, _extends2[query.id] = obj, _extends2));
      }
    // query/error
    //
    // * Set error
    // * Set loading to false
    //

    case QUERY_ERROR:
      {
        var _extends3;

        var _act$payload = act.payload,
            _query = _act$payload.query,
            error = _act$payload.error;

        var _obj = _extends({}, state[_query.id]) || {};

        _obj.error = error;
        _obj.loading = false;
        return _extends({}, state, (_extends3 = {}, _extends3[_query.id] = _obj, _extends3));
      }
    // query/result
    //
    // * Merge dataIds
    // * Set loading to false
    //

    case QUERY_RESULT:
      {
        var _extends4;

        var _act$payload2 = act.payload,
            _query2 = _act$payload2.query,
            data = _act$payload2.data,
            next = _act$payload2.next;

        var _obj2 = _extends({}, state[_query2.id]) || {};

        _obj2.loading = false;
        _obj2.next = next;
        var ids = data.map(function (o) {
          return o.id;
        });

        if (array(_obj2.dataIds)) {
          ids.push.apply(ids, _obj2.dataIds);
        }

        _obj2.dataIds = Array.from(new Set(ids));
        return _extends({}, state, (_extends4 = {}, _extends4[_query2.id] = _obj2, _extends4));
      }
  }

  return state;
}

function objects(state, _) {
  if (state === void 0) {
    state = {};
  }

  return state;
}

var reducer =
/*#__PURE__*/
redux.combineReducers({
  queries: queries,
  objects: objects
});

var queries$1 = function queries(state) {
  return state.queries;
};

var queryData =
/*#__PURE__*/
reselect.createSelector(queries$1, function (_, id) {
  return id;
}, function (data, id) {
  return data[id];
});

var _marked$1 =
/*#__PURE__*/
regeneratorRuntime.mark(query);

function query(query, runner) {
  var _ref, next, options, task, result;

  return regeneratorRuntime.wrap(function query$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return saga.select(function (state) {
            return queryData(state, query.id);
          });

        case 2:
          _ref = _context.sent;
          next = _ref.next;
          options = {
            next: next
          };
          _context.prev = 5;
          _context.next = 8;
          return saga.race({
            result: saga.call(runner, options),
            cancelled: saga.call(cancel, query)
          });

        case 8:
          task = _context.sent;

          if (!task.cancelled) {
            _context.next = 11;
            break;
          }

          return _context.abrupt("return");

        case 11:
          result = task.result;

          if (!defined(result.error)) {
            _context.next = 14;
            break;
          }

          throw result.error;

        case 14:
          if (!defined(result.data)) {
            _context.next = 17;
            break;
          }

          _context.next = 17;
          return saga.put(queryResult(query, array(result.data) ? result.data : [result.data], result.next));

        case 17:
          _context.next = 24;
          break;

        case 19:
          _context.prev = 19;
          _context.t0 = _context["catch"](5);
          _context.next = 23;
          return saga.put(queryError(query, _context.t0));

        case 23:
          return _context.abrupt("return", _context.sent);

        case 24:
        case "end":
          return _context.stop();
      }
    }
  }, _marked$1, null, [[5, 19]]);
}

function init(resolver) {
  return (
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      var triggers, chan, action, query$1, runner;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              // Only listen to new requests since cancelation is
              // handled by internally by specific workers
              triggers = [QUERY_FETCH]; // Makes sure we don't miss any action no matter what

              _context.next = 3;
              return saga.actionChannel(triggers);

            case 3:
              chan = _context.sent;

            case 4:

              _context.next = 7;
              return saga.take(chan);

            case 7:
              action = _context.sent;
              // Get runner
              query$1 = action.payload.query;
              _context.next = 11;
              return saga.call(resolver, query$1);

            case 11:
              runner = _context.sent;

              if (!(action.type === QUERY_FETCH)) {
                _context.next = 15;
                break;
              }

              _context.next = 15;
              return saga.spawn(query, query$1, runner);

            case 15:
              _context.next = 4;
              break;

            case 17:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })
  );
}

function createEngine(_ref) {
  var resolver = _ref.resolver;
  return {
    reducer: reducer,
    engine: init(resolver)
  };
}

exports.createEngine = createEngine;
//# sourceMappingURL=anyql.cjs.development.js.map
