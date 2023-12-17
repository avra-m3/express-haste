import request from "supertest"
import app from "../docs/examples/simple";

describe('requires', () => {

    it('Should validate the request body', async () => {
        return request(app)
            .post('/pets')
            .send({
                type: 'fish',
                breed: 'carp'
            })
            .expect(400)
            .expect({
                type: 'about:blank',
                title: 'Bad request',
                detail: 'Request failed to validate',
                issues: [
                    {
                        code: 'invalid_enum_value',
                        path: ["type"],
                        message: "Invalid enum value. Expected 'cat' | 'dog', received 'fish'"
                    }
                ]
            })
    });


    it('Should validate the request header exists', async () => {
        return request(app)
            .post('/pets')
            .set({ Authorization: 'abc123' })
            .send({
                type: 'cat',
                breed: 'tomcat'
            })
            .expect(200)
            .expect({})
    });
});
