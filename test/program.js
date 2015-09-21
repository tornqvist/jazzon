'use strict';

let resolve = require('path').resolve;
let test = require('tape');
let pkg = require('../package.json');
let jazzon = require(resolve(__dirname, '..', pkg.main));

test('program is recursive', assert => {
  let instance = jazzon.create();
  let json = {
    foo: '${ foo }'
  };
  let expected = {
    foo: {
      bar: 'foobar'
    }
  };

  instance
    .use(function (value, name) {
      return new Promise((resolve) => {
        switch (name) {
        case 'foo': resolve({ bar: '${ bar }' }); break;
        case 'bar': resolve('foobar'); break;
        default: assert.fail('this should not happen'); break;
        }
      });
    })
    .compile(json)
    .then((result) => {
      assert.deepLooseEqual(result, expected);
      assert.end();
    }, assert.end);
});
