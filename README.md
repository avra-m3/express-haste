
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
the data you expect. They seamlessly plug into [document](#documenting---document)
should you wish to use it.

#### Validating a request body.
Validating your request contains the expected contents is as simple as;
```typescript
import express, { json } from 'express';
import {requires} from 'express-haste';
import {PetSchema} from './docs/examples/simple/petHandler';

const app = express();
app.post('/pets', requires(PetSchema).in('body'), myHandler);
```

#### Validating a header.
Validating a header uses the full power of [zod](https://zod.dev/) and [zod-openapi](https://raw.githubusercontent.com/samchungy/zod-openapi)

```typescript
import express, { json } from 'express';
import { requires } from 'express-haste';
import { z } from "zod";

const Authorization = z.string().openapi({
    param: {
        in: 'header',
        name: 'authorization'
    }
});

const app = express();
app.post('/pets', requires(Authorization), petHandler);
```
### Documenting
Documenting your app is as simple as follows;
```typescript

import {document} from 'express-haste';
//... All your routing, it's important these have been finalised before you call document.
document(app, {
    appTitle: 'My First App',
    appVersion: '1.0.0'
})
app.listen(3000, () => {
    console.log('All aboard! http://localhost:3000/documentation')
})
```
