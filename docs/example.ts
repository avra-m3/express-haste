import express, { json } from "express";
import * as haste from "../src";
import { Authentication, exampleHandler, PetSchema } from "./exampleHandler";

const app = express();

app.use(json())

app.post('/pets',
    haste.requires(PetSchema).in("body"),
    haste.requires(Authentication).in('header'),
    exampleHandler
)

haste.document(app, {
    appTitle: 'MyPets',
    appVersion: '0.0.1',
});

export default app;