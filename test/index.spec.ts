import express, { json } from "express";
import { hasten } from "../src";
import request from "supertest"
import { Express } from "express-serve-static-core";
import { z } from "zod";

describe('requires', () => {
    let app: Express;
    beforeAll(() => {

    })

    it('Should validate the request', async () => {
        return  request(app)
            .post('/pets')
            .send({
                type: 'cat',
                breed: 'burmese'
            })
            .expect(400)
    });
});
