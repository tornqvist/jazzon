'use strict';

let resolve = require('path').resolve;
let test = require('tape');
let pkg = require('../package.json');
let jazzon = require(resolve(__dirname, '..', pkg.main));

const noop = function * noop() {};

test('jazzon.create() returns a new instance', assert => {
  let instance = jazzon.create();

  assert.notEqual(instance, jazzon, 'it is truly a new object');

  for (let key in jazzon) {
    assert.ok(instance.hasOwnProperty(key), `it has "${ key }"`);
    assert.equal(
      instance[key].toString(),
      jazzon[key].toString(),
      `it.${ key } is the same as jazzon.${ key }`);
  }

  assert.end();
});

test('jazzon exposes a use method', assert => {
  let instance = jazzon.create();

  assert.equal(typeof instance.use, 'function', 'it is a function');
  assert.equal(typeof instance.use(noop).use, 'function', 'it is chainable');
  assert.end();
});

test('jazzon exposes a compile method', assert => {
  let instance = jazzon.create();

  assert.equal(typeof instance.compile, 'function', 'it is a function');
  assert.ok(instance.compile({}) instanceof Promise, 'it returns a promise');
  assert.end();
});

test('jazzon.plugins is immutable', assert => {
  let instance = jazzon.create();

  assert.notEqual(instance.plugins, instance.plugins, 'accessing plugins returns a unique instance');

  instance.plugins.push('foo');

  assert.equal(instance.plugins.indexOf('foo'), -1, 'plugins.push() does not mutate');

  assert.throws(() => instance.plugins = 'foo', 'trying to set plugins throws an error');

  assert.end();
});

test('jazzon.compile() does not mutate', assert => {
  let instance = jazzon.create();
  let json = { foo: 'bar' };

  instance
    .compile(json)
    .then((result) => {
      assert.deepLooseEqual(result, json, 'it returns a similar object');
      assert.notEqual(result, json, 'it is not the same object');
      assert.end();
    }, assert.end);
});

test('plugin manipulates the output', assert => {
  let instance = jazzon.create();
  let json = { greeting: '${ phrase(Hello, world) | punctuation }' };

  instance
    .use(function (value, name, args) {
      switch (name) {

      case 'phrase':
        assert.looseEqual(value, null, 'no value is supplied to first helper');
        assert.equal(name, 'phrase', 'plugin was called with name');
        assert.deepEqual(args, ['Hello', 'world'], 'plugin was called with args');
        assert.deepLooseEqual(this, json, 'calling context is bound to current tree');
        return Promise.resolve(args.join(' '));

      case 'punctuation':
        assert.equal(value, 'Hello world', 'value was forwarded from first helper');
        return Promise.resolve(value += '!');

      default:
        return Promise.resolve(value);
      }
    })
    .compile(json)
    .then((result) => {
      assert.equal(result.greeting, 'Hello world!', 'plugin manipulated output');
      assert.end();
    }, assert.end);
});
