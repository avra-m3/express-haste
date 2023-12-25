import {
  createPetRequirements,
  createPetHandler,
  getOnePetRequirements,
  getOnePet,
  searchPetRequirements,
  searchPets,
} from './petHandler';
import express, { json } from 'express';
import { document } from 'express-haste';
import cookieParser from 'cookie-parser';
import { getRedocHtml } from "./redoc";

const app = express();

app.use(json());
app.use(cookieParser());

app.post('/pets/:id', createPetRequirements, createPetHandler);

app.get('/pets', searchPetRequirements, searchPets);
app.get('/pet/:id', getOnePetRequirements, getOnePet);

const spec = document(app, {
  info: {
    title: 'MyPets',
    version: '0.0.1',
  },
});

app.get(`/docs/openapi.json`, (req, res) => res.status(200).json(spec));
app.get('/docs', (req, res) => {
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
