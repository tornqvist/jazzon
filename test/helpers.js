'use strict';

let resolve = require('path').resolve;
let test = require('tape');
let pkg = require('../package.json');
let jazzon = require(resolve(__dirname, '..', pkg.main));

test('helpers are chained', assert => {
  let instance = jazzon.create();
  let json = { foo: '@{ foo | bar }' };

  instance
    .use(function (state, helper) {
      return new Promise((resolve) => {
        switch (helper) {
        case 'foo': resolve('foo'); break;
        case 'bar': resolve(state + 'bar'); break;
        default: assert.fail('should not fall through'); break;
        }
      });
    })
    .compile(json)
    .then((result) => {
      assert.equal(result.foo, 'foobar', 'helper output have been concatinated');
      assert.end();
    }, assert.end);
});

test('helper basic return values', assert => {
  let instance = jazzon.create();
  let fixtures = ['string', 'promise', 'function', 'generator', 'generatorFunction'];
  let json = { test: `@{ ${ fixtures.join('|') } }` };

  instance
    .use(function (state, helper) {
      state = (state || '');

      switch (helper) {
      case 'string':
        return state + 'string';
      case 'promise':
        return Promise.resolve(state + 'promise');
      case 'function':
        return function () { return state + 'function'; };
      case 'generator':
        return (function * () { return state + 'generator'; }());
      case 'generatorFunction':
        return function * () { return state + 'generatorFunction'; };
      default:
        assert.fail('should not fall through');
        break;
      }
    })
    .compile(json)
    .then((result) => {
      assert.equal(
        result.test,
        fixtures.join(''),
        `works with return types: ${ fixtures.join(', ') }`);
      assert.end();
    }, assert.end);
});

test('helper can return an object', assert => {
  let instance = jazzon.create();
  let json = { test: '@{ obj }' };

  instance
    .use(function (state, helper) {
      switch (helper) {
      case 'obj':
        return {
          string: 'foo',
          promise: Promise.resolve('bar')
        };
      default:
        assert.fail('should not fall through');
        break;
      }
    })
    .compile(json)
    .then((result) => {
      assert.deepLooseEqual(
        result.test,
        { string: 'foo', promise: 'bar' },
        'object with nestled promise resolves');
      assert.end();
    }, assert.end);
});

test('helper can return an array', assert => {
  let instance = jazzon.create();
  let json = { test: '@{ arr }' };

  instance
    .use(function (state, helper) {
      switch (helper) {
      case 'arr':
        return [
          'foo',
          Promise.resolve('bar')
        ];
      default:
        assert.fail('should not fall through');
        break;
      }
    })
    .compile(json)
    .then((result) => {
      assert.deepLooseEqual(
        result.test,
        ['foo', 'bar'],
        'array with nestled promise resolves');
      assert.end();
    }, assert.end);
});
