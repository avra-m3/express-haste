import {
  createPetRequirements,
  createPetHandler,
  getOnePetRequirements,
  getOnePet,
  searchPetRequirements,
  searchPets,
} from './petHandler';
import express, { Router, json } from 'express';
import { document } from 'express-haste';
import cookieParser from 'cookie-parser';
import { getRedocHtml } from "./redoc";
import { header } from 'express-haste';
import { UsernamePasswordAuth } from './schemas';

const app = express();

app.use(json());
app.use(cookieParser());

// Define the document router before middleware asking for a username:password header.
const docRouter = Router()
app.use('/docs', docRouter)

// Get one pet is exempt from needing a header for demo reasons.
app.get('/pet/:id', getOnePetRequirements, getOnePet);

// Require an authorization header
app.use(header('authorization', UsernamePasswordAuth))

app.post('/pets/:id', createPetRequirements, createPetHandler);
app.get('/pets', searchPetRequirements, searchPets);

const spec = document(app, {
  info: {
    title: 'MyPets',
    version: '0.0.1',
  },
});

docRouter.get(`/openapi.json`, (req, res) => res.status(200).json(spec));
docRouter.get('/', (req, res) => {
  res
    .contentType('text/html')
    .status(200)
    .send(
      getRedocHtml({
        apiPath: `/docs/openapi.json`,
      })
    );
});


export default app;
