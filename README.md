
<p align="center">
  <img src="docs/assets/logo.png" width="200px" align="center" alt="express-haste logo" style="margin-bottom: -50px" />
  <h1 align="center">express-haste</h1>
<p align="center">
A Typescript library that makes documentation, and I/O validation first class passengers in expressJS
</p>
<div align="center">
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


### Types
Who doesn't love having a typed application, you can add typing to your request based on the validation you specify, here's an example;

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

import {document} from 'express-haste';
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
