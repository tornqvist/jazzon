# jazzon

Working with static JSON files for mocking data or whatever other purposes can be a real bore. Jazzon is a convenience utility for generating, concatenating and streamlining the handling of static JSON files.

## Installation

```bash
$ npm install --save jazzon
```

## Usage

In and of it self jazzon does nothing, really. It's sole purpose is to allow for registered plugins to act on helpers identified in data passed through jazzon.

To illustrate a most basic scenario, this is how one might use jazzon together with [jazzon-uuid](https://github.com/tornqvist/jazzon-uuid)

```javascript
const jazzon = require('jazzon');
const uuid = require('jazzon-uuid');

let data = { id: "${ uuid }" };

jazzon.use(uuid());

jazzon
  .compile(data)
  .then(result => console.log(result)); // => {id: "6c84fb90-12c4-11e1-840d-7b25c5ee775a"}
```

In this scenario, jazzon encounters the helper `uuid` and calls each registered plugin (in this case `jazzon-uuid`) on it.

Helpers can also be chained using the pipe (`|`) symbol. Each chained helper gets the output of the previous helper to operate on. To illustrate a more complex scenario, take these two models:

```javascript
// user.json

{
  "id": "${ uuid }",
  "name": "${ name.findName }",
  "email": "${ internet.email }",
  "username": "${ internet.userName }"
}
```

```javascript
// users.json

{
  "total": 3,
  "users": "${ import(user.json) | pick(id, username) | repeat(3) }"
}
```

Running `users.json` through jazzon would produce something like this:

```javascript
{
  "total": 3,
  "users": [{
    "id": "a76f535f-cbc6-4c09-8151-573e200c1dbf",
    "username": "Doug.Simonis28"
  }, {
    "id": "0a512648-c418-40a6-90ac-1bb5ef1e7fab",
    "username": "Virgil_Kunze"
  }, {
    "id": "88d6903f-d13b-4d16-877e-f906461c69aa",
    "username": "Grady.Koelpin"
  }]
}
```

## Syntax

The syntax of helpers are very similar to [JavaScript template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/template_strings) to clearly illustrate their purpose.

The string must start with `${` and end with `}`. Each helper is separated with a `|` symbol. Encountering an invalid template-ish string will throw an error.

Use [this regexr](http://regexr.com/3brq4) to experiment with the template strings.

## Plugins

Plugins should export a function that get's called once for every helper encountered by jazzon. The convention is to export a factory function that returns the plugin function.

A plugin really is just a reducer that jazzon uses to process all the helpers. Therefore a plugin should *always* return a value, even if it does not manipulate the value. A switch statement does the job as so:

```javascript
// myplugin.js

module.exports = function (otions) {
  return function (value, helper, args) {
    switch (helper) {
    case 'name':
      return args[0] || options.default;
    case 'wrap':
      return `Hello ${ value }!`;
    default:
      return value;
    }
  }
};
```

```javascript
// myprogram.js

jazzon
  .use(myplugin({
    default: 'world'
  }))
  .compile({
    "first": "${ name | wrap }",
    "second": "${ name(Joe) | wrap }"
  })
  .then(result => console.log(result)); // => {"first": "Hello world!", "second": "Hello Joe!"}
```

Jazzon also supports async plugins. Under the hood, jazzon is using [co](https://github.com/tj/co) so anything that co can handle jazzon can handle. As so, a plugin may expose a Promise, generator, generator function, function, Object or Array. See some of the plugins for examples of how this is achieved.

### Availible plugins

- [jazzon-uuid](https://github.com/tornqvist/jazzon-uuid) *Generates a UUID*
- [jazzon-import](https://github.com/tornqvist/jazzon-import) *Import other files in place*

To add your own plugin, add it to the list and make a pull request.

## API

- `jazon.create(/*plugins*/)` Creates a new instance of jazzon with optional list of plugins.
  - *Returns jazzon*
- `jazzon.use(plugin)` Adds a plugin to be used when transforming template strings.
  - *Returns jazzon*
- `jazzon.compile(object)` Iterates over the object looking for template strings to transform.
  - *Returns a Promise*
- `jazzon.plugins` An list of registered helpers on this instance.
  - *Returns an Array*
  - *Is immutable*

## TODO

- [x] Add documentation
- [x] Add wrapper for non-Promises returned from plugins
- [ ] Add test for plugins (generator/non-generator)
- [ ] Better error handling
- [ ] Add CLI
