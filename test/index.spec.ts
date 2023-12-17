import request from "supertest"
import app from "../docs/examples/simple";

describe('requires', () => {

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
