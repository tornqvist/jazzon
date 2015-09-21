'use strict';

let resolve = require('path').resolve;
let test = require('tape');
let pkg = require('../package.json');
let jazzon = require(resolve(__dirname, '..', pkg.main));

test('helpers are chained', assert => {
  let instance = jazzon.create();
  let json = { foo: '${ foo | bar }' };

  instance
    .use(function (value, name) {
      return new Promise((resolve) => {
        switch (name) {
        case 'foo': resolve('foo'); break;
        case 'bar': resolve(value + 'bar'); break;
        default: assert.fail('this should not happen'); break;
        }
      });
    })
    .compile(json)
    .then((result) => {
      assert.equal(result.foo, 'foobar', 'helper output have been concatinated');
      assert.end();
    }, assert.end);
});
