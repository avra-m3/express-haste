import express, { json } from 'express';
import * as haste from 'express-haste';
import {
  Authentication,
  petHandler,
  PetIdInQuery,
  PetIdInPath,
  PetSchema,
  SessionCookie,
  petGetHandler,
} from './petHandler';
import cookieParser from 'cookie-parser';

const app = express();

app.use(json());
app.use(cookieParser());

app.post('/pets', haste.requires(PetSchema).in('body'), haste.requires(Authentication), petHandler);

app.get('/pets', haste.requires(SessionCookie), haste.requires(PetIdInQuery), petGetHandler);
app.get('/pet/:petId', haste.requires(SessionCookie), haste.requires(PetIdInPath), petGetHandler);

haste.document(app, {
  appTitle: 'MyPets',
  appVersion: '0.0.1',
  enableSwaggerUI: true
});

export default app;
