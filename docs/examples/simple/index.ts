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

const app = express();

app.use(json());
app.use(cookieParser());

app.post('/pets', createPetRequirements, createPetHandler);

app.get('/pets', searchPetRequirements, searchPets);
app.get('/pet/:petId', getOnePetRequirements, getOnePet);

document(app, {
  info: {
    title: 'MyPets',
    version: '0.0.1',
  },
});

export default app;
