'use strict';

let resolve = require('path').resolve;
let test = require('tape');
let pkg = require('../package.json');
let jazzon = require(resolve(__dirname, '..', pkg.main));

test('helpers are chained', assert => {
  let instance = jazzon.create();
  let json = { foo: '${ foo | bar }' };

  instance
    .use(function (value, helper) {
      return new Promise((resolve) => {
        switch (helper) {
        case 'foo': resolve('foo'); break;
        case 'bar': resolve(value + 'bar'); break;
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
  let json = { test: '${' + fixtures.join('|') + '}' };

  instance
    .use(function (value, helper) {
      value = (value || '');

      switch (helper) {
      case 'string':
        return value + 'string';
      case 'promise':
        return Promise.resolve(value + 'promise');
      case 'function':
        return function () { return value + 'function'; };
      case 'generator':
        return (function * () { return value + 'generator'; }());
      case 'generatorFunction':
        return function * () { return value + 'generatorFunction'; };
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
  let json = { test: '${ obj }' };

  instance
    .use(function (value, helper) {
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
  let json = { test: '${ arr }' };

  instance
    .use(function (value, helper) {
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
