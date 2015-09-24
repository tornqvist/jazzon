'use strict';

let resolve = require('path').resolve;
let test = require('tape');
let pkg = require('../package.json');
let jazzon = require(resolve(__dirname, '..', pkg.main));

test('plugin context is current tree level', assert => {
  let instance = jazzon.create();
  let json = {
    one: {
      test: '@{ top }',
      two: {
        test: '@{ bottom }',
        bar: 'baz'
      }
    }
  };

  instance
    .use(function (state, helper) {
      switch (helper) {
      case 'top':
        assert.deepLooseEqual(this, json.one, 'context is level one');
        break;
      case 'bottom':
        assert.deepLooseEqual(this, json.one.two, 'context is level two');
        break;
      default:
        assert.fail('should not fall through');
        break;
      }

      return state;
    })
    .compile(json)
    .then(() => assert.end(), assert.end);
});

test('plugin arguments', assert => {
  let instance = jazzon.create();
  let json = { foo: '@{ first(foo, bar) | second }' };

  instance
    .use(function (state, helper, args) {
      switch (helper) {
      case 'first':
        assert.looseEqual(state, null, 'first helpers has no state');
        assert.deepEqual(args, ['foo', 'bar'], 'gets helper arguments');
        return Promise.resolve('foo');
      case 'second':
        assert.equal(state, 'foo', 'state is output from last helper');
        return Promise.resolve(state);
      default:
        assert.fail('should not fall through');
      }
    })
    .compile(json)
    .then(() => assert.end(), assert.end);
});
