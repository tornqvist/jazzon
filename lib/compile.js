'use strict';

let co = require('co');
let clone = require('lodash.clonedeep');
let isObject = require('lodash.isplainobject');
let isString = require('lodash.isstring');
let isFunction = require('lodash.isfunction');
let isGenerator = require('is-generator');
let isError = require('lodash.iserror');

// Matches individual helper declaration
const PLUGIN = '(\\w+)(?:\\((.+)\\))?';

// Matches the helper syntax (required curly wrappers and pipe separator)
const SYNTAX = `(?:(?:(?:{|\\|)\\s*)(?:${ PLUGIN })(?=\\s*(?:\\||})))`;

// Matches all helpers
const PLUGIN_ALL = new RegExp(SYNTAX, 'g');

// Matches individual helper
const PLUGIN_ONE = new RegExp(PLUGIN);

// Qualifier for helper declarations
const IDENTIFIER = /^\${.+}$/;

// Arguments separator
const ARG_SPLIT = /\s*,\s*/;

/**
 * Compile given json object
 * @param  {Mixed} json    JSON object to transform
 * @param  {Array} plugins List of plugins to apply to all helpers
 * @return {Promise}       Resolves to a transformed copy of the given JSON
 */

function compile(json, plugins) {
  /**
   * Ensure that the input is not modified
   */

  let source = clone(json);

  let transform = co.wrap(function * (value, ctx) {
    let output = null;
    let helpers = value.match(PLUGIN_ALL);

    /**
     * Iterate over all identified helpers
     */

    for (let helper of helpers) {
      let match = helper.match(PLUGIN_ONE);

      /**
       * Reject any malformed helper declaration
       */

      if (!match) {
        return Promise.reject(new Error(`Invalid helper syntax at "${ value }"`));
      }

      /**
       * Seperate helper name form arguments
       */

      let name = match[1];
      let args = match[2] && match[2].trim().split(ARG_SPLIT);

      /**
       * Iterate over all the plugins letting them each have a go at the helper
       */

      for (let plugin of plugins) {
        output = yield promisify(plugin.call(ctx, output, name, args), ctx);
      }
    }

    /**
     * Recursively call the parse method
     */

    return co(function * () {
      return yield parse(output, transform);
    });
  });

  /**
   * Run the source through our parser supplying a transform callback
   */

  return co(function * () {
    return yield parse(source, transform);
  });
}

/**
 * Replaces all tempalte-ish strings with a co-promise
 */

function parse(ctx, transform) {
  let keys;
  let isArray = Array.isArray(ctx);

  /**
   * Immediately resolve anything we cannot iterate over
   */

  if (!isObject(ctx) && !isArray) { return Promise.resolve(ctx); }

  /**
   * Normalize a list of keys depending on wether it is an Array or an Object
   */

  if (isArray) {
    keys = ctx.map((val, index) => index);
  } else {
    keys = Object.keys(ctx);
  }

  /**
   * Loop through the object calling the transform on any qualifying strings
   */

  for (let i = 0, l = keys.length; i < l; i += 1) {
    let key = keys[i];
    let value = ctx[key];

    if (isString(value) && IDENTIFIER.test(value)) {
      ctx[key] = transform(value, ctx);
    } else if (isFunction(value)) {
      ctx[key] = promisify(value, ctx);
    } else {
      parse(value, transform);
    }
  }

  return ctx;
}

/**
 * Wraps non co-compliant values in a Promise
 * @param  {Mixed} val Object to turn in to a promise
 * @return {Mixed}     Value (potentially) wrapped in a Promise
 */

function promisify(val, ctx) {
  let isPromise = (val instanceof Promise);

  /**
   * Don't wrap co-compliant values
   */

  if (isPromise || isGenerator(val) || Array.isArray(val) || isObject(val)) {
    return val;
  }

  /**
   * Execute functions to expose their inners
   */

  if (isFunction(val)) {
    return promisify(val.call(ctx));
  }

  /**
   * Make a best guess as to the status of the Promise
   */

  if (isError(val)) {
    return Promise.reject(val);
  } else {
    return Promise.resolve(val);
  }
}

module.exports = compile;
