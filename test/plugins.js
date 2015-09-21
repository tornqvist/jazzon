'use strict';

let resolve = require('path').resolve;
let test = require('tape');
let pkg = require('../package.json');
let jazzon = require(resolve(__dirname, '..', pkg.main));

test('plugin context is current tree level', assert => {
  let instance = jazzon.create();
  let json = {
    one: {
      test: '${ top }',
      two: {
        test: '${ bottom }',
        bar: 'baz'
      }
    }
  };

  instance
    .use(function (value, name) {
      switch (name) {
      case 'top':
        assert.deepLooseEqual(this, json.one, 'context is level one');
        break;
      case 'bottom':
        assert.deepLooseEqual(this, json.one.two, 'context is level two');
        break;
      default:
        assert.fail('this should not happen');
        break;
      }

      return Promise.resolve(value);
    })
    .compile(json)
    .then(() => assert.end(), assert.end);
});

test('plugin arguments', assert => {
  let instance = jazzon.create();
  let json = { foo: '${ first(foo, bar) | second }' };

  instance
    .use(function (value, name, args) {
      switch (name) {
      case 'first':
        assert.looseEqual(value, null, 'first helpers has no value');
        assert.deepEqual(args, ['foo', 'bar'], 'gets helper arguments');
        return Promise.resolve('foo');
      case 'second':
        assert.equal(value, 'foo', 'value is output from last helper');
        return Promise.resolve(value);
      default:
        assert.fail('this should not happen');
        return Promise.resolve(value);
      }
    })
    .compile(json)
    .then(() => assert.end(), assert.end);
});
