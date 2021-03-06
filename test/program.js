'use strict';

let resolve = require('path').resolve;
let test = require('tape');
let pkg = require('../package.json');
let jazzon = require(resolve(__dirname, '..', pkg.main));

test('program is recursive', assert => {
  let instance = jazzon.create();
  let json = {
    foo: '@{ foo }'
  };
  let expected = {
    foo: {
      bar: 'foobar'
    }
  };

  instance
    .use(function (state, helper) {
      return new Promise((resolve) => {
        switch (helper) {
        case 'foo': resolve({ bar: '@{ bar }' }); break;
        case 'bar': resolve('foobar'); break;
        default: assert.fail('should not fall through'); break;
        }
      });
    })
    .compile(json)
    .then((result) => {
      assert.deepLooseEqual(result, expected);
      assert.end();
    }, assert.end);
});

test('helper names may be dot notaded', assert => {
  let instance = jazzon.create();
  let json = { test: '@{ much.helper | other.helper.very.nested(with, args) }' };

  instance
    .use(function (state, name, args) {
      switch (name) {
      case 'much.helper':
        assert.pass('dot notaded helper identified');
        break;
      case 'other.helper.very.nested':
        assert.pass('deep nested helper identified');
        assert.deepLooseEqual(args, ['with', 'args'], 'nested helper does not affect args');
        break;
      default:
        assert.fail('should not fall through');
        break;
      }
    })
    .compile(json)
    .then(() => assert.end(), assert.end);
});

test('helper arguments are unwrapped from quotes', assert => {
  let instance = jazzon.create();
  let json = {
    test: '@{ helper("") | helper(" ") | helper("foo") | helper(\'bar\', "baz") | helper(\' \') }'
  };

  instance
    .use(function (state, name, args) {
      return ((state || '') + args.join(''));
    })
    .compile(json)
    .then(result => {
      assert.equal(result.test, ' foobarbaz ');
      assert.end();
    }, assert.end);
});
