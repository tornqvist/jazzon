'use strict';

let compile = require('./lib/compile');

/**
 * Factory for creating an instance
 * @param  {Array} plugins List of helpers to "use"
 * @return {Object}        An instance of jazzon
 */

function create(plugins) {
  plugins = Array.isArray(plugins) ? plugins : [];

  let jazzon = {

    /**
     * Allow access to a shallow copy of the plugins
     */

    get plugins() {
      return plugins.slice(0);
    },

    /**
     * But don't allow modifying it
     */

    set plugins(value) {
      throw (new Error('Plugins is immutable'));
    }
  };

  /**
   * Expose the factory function for modularity
   */

  jazzon.create = create;

  /**
   * Set up a simple "use interface"
   */

  jazzon.use = (fn) => {
    plugins.push(fn);
    return jazzon;
  };

  /**
   * Proxy the compile function with the current set of plugins
   */

  jazzon.compile = (json) => compile(json, plugins);

  return jazzon;
}

module.exports = create();
