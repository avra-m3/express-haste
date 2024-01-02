<p align="center">
  <img src="docs/assets/logo.png" width="200px" align="center" alt="express-haste logo" style="margin-bottom: -50px" />
  <h1 align="center">express-haste</h1>
<p align="center">
A Typescript library that makes documentation, and I/O validation first class passengers in expressJS
</p>
<div align="center">
  <a style="text-decoration: none" href="https://github.com/avra-m3/express-haste/actions/workflows/test.yml">
  <img src="https://github.com/avra-m3/express-haste/actions/workflows/test.yml/badge.svg" alt="Test Status"/>
  </a>
  <a href="https://github.com/avra-m3/express-haste/actions/workflows/release.yml">
  <img src="https://github.com/avra-m3/express-haste/actions/workflows/release.yml/badge.svg" alt="Release Status"/>
  </a>
</div>
<br>

## Why Express-Haste?

There are many great zod-express integrations that already exist if you're starting a new project.
Not all of us are so lucky to be starting fresh. Express-Haste aims to be simple to retrofit into
your existing express project, while minimising developer toil.

Have an idea on how we can do this better? Raise an [issue](https://github.com/avra-m3/express-haste/issues/new/choose).

## Install

Install via `npm` or `yarn`:

```bash
npm install express express-haste
## or
yarn add express express-haste
```

## Usage

### Validators

Validators are middlewares that ensure you are getting or responding with
the data you expect. They seamlessly plug into the [document](#documenting---document) api
should you wish to use it.

A simple validated request in an app, looks as follows;

```typescript
import express, { json } from 'express';
import { document } from 'express-haste';
import cookieParser from 'cookie-parser';
import { requiresMany } from "./requiresMany";
import { requires, body, query, header } from "./index";
import { z } from 'zod';


const app = express();

app.post('/test', requires(
  body(z.object({})),
  query('someParam', z.string().default('somevalue')),
  query('manyparam', z.string().array()),
  header('x-my-header', z.string().uuid())
), handler);
```

#### `body(schema)`

Given a zod schema, validates the req.body matches that schema and will make it the required body for that request
in the documentation. You may only provide one body, more than one will result in undefined behaviour for now.

#### `header(key, schema)`

Given a key and a ZodSchema, validate the header passes schema validation.

*You should always start with z.string() here but you can use [.transform](https://zod.dev/?id=transform)*
*and [.refine](https://zod.dev/?id=refine) to abstract validation logic.*

#### `cookie(key, schema)`

Given a key and a ZodSchema, validate the cookie passes schema validation, you will need
the [cookie-parser middleware](https://expressjs.com/en/resources/middleware/cookie-parser.html)
or similar for this to work.

*You should always start with z.string() here but you can use [.transform](https://zod.dev/?id=transform)*
*and [.refine](https://zod.dev/?id=refine) to abstract validation logic.*

#### `query(key, schema)`

Given a key and a Schema, validate a search/query parameter meets that validation, valid starting types are

- `z.string()` For single values
- `z.string().array()` For multiple values, ie; `?a=1&a=2` -> `[{a: [1,2]}]`

#### `path(key, schema)`

Given a key and a Schema, validate a path parameter listed in your path, key should take the exact same name as the
`:name` given to the parameter

#### `response(status, schema, {description})`

Given a string status code, zod schema, and optionally a description, add this response to the documentation.
This validator will **NOT** validate the response, but will provide type checking if using `HasteRequestHandler`.


#### Applying validation to many requests;
As a middleware, you can `use` validation middleware and apply it to many requests, like follows;
```typescript
const app = express();

app.use(header('authorization', z.string()))
```

This will also apply the header to all routes defined after this middleware in the documentation.

##### Limitations
- Haste will only group ZodErrors that are grouped in the same `require`, you will receive two groups of errors when 
applying validation in both use middleware and on a route.
- While a pathless use will apply documentation, adding a path ie `use('/test')` will likely create unexpected behaviour, testing
this case would be a good idea.

### Errors

When validation fails, express-haste will return an opinionated RFC-7807 compliant error (customization is on the
roadmap.)

**Example Error**

```json
{
  "type": "about:blank",
  "title": "Bad request",
  "detail": "Request failed to validate",
  "issues": [
    {
      "code": "zod issue code",
      "path": [
        "type"
      ],
      "message": "zod issue message"
    }
  ]
}
```

### Types

Who doesn't love having a typed application, you can add typing to your request based on the validation you specify,
here's an example;

```typescript
import express, { json } from "express";
import { document } from "express-haste";
import cookieParser from "cookie-parser";
import { requiresMany } from "./requiresMany";
import { requires, body, query, header, HasteRequestHandler } from "./index";
import { z } from "zod";


const app = express();

const testRequirements = requires(
  body(z.object({ param: z.string().optional() })),
  query("someParam", z.string().default("somevalue")),
  query("manyparam", z.string().array()),
  path("pathid", z.string().transform(z.number().parse)),
  response(200, z.object({
    returnValue: z.number()
  }))
)

const handler: HasteRequestHandler<typeof testRequirements> = (req, res) => {
  req.body; // Will be {param?: string}
  req.query.someParam; // Will be string
  req.query.someParam; // Will be string[]
  req.params.pathid; // This will be number (and transformed correctly to number in the request.
  res.json({
    // This will be {returnValue: number}
  });
};

app.post("/test/:pathid", testRequirements, handler);
```
### Documenting

The document api, will automatically pick up the routes currently mounted on your app and return an openapi json object.
You can then feed this into the openapi provider of your choice to generate documentation.

```typescript

import { document } from 'express-haste';
//... All your routing, it's important these have been finalised before you call document.
const spec = document(app, {
  appTitle: 'My First App',
  appVersion: '1.0.0'
})

// ... Add your /documentation routes using spec.

app.listen(3000, () => {
  console.log('All aboard! http://localhost:3000/documentation')
})
```

### More examples

The best way to understand how something works is to see it in action, check out [the examples](/docs/examples) for
full end-to-end examples of how express-haste works.

### Roadmap

* [X] Request Handler typing.
* [ ] Improve test coverage.
* [ ] Lint and Test checking in github actions.
* [ ] Tests for typing (it's very fragile and hard to catch all edge cases manually).
* [ ] Explore whether typing can be made less complicated.
* [ ] Ability to pass many parameters into one query, header, etc function call.
  ie; `query({q1: z.string(), q2: z.string()})`.
* [ ] Ability to customize error response when the request fails.
* [ ] Define behaviour for when many of the same body validation schemas are provided.
* [ ] Response validation and/or warning.