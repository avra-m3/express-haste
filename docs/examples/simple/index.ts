import express, { json } from "express";
import * as haste from "../../../src";
import { Authentication, petHandler, PetSchema } from "./petHandler";

const app = express();

app.use(json())

app.post('/pets',
    haste.requires(PetSchema).in("body"),
    haste.requires(Authentication),
    petHandler
)

haste.document(app, {
    appTitle: 'MyPets',
    appVersion: '0.0.1',
});

export default app;