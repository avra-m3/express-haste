import request from 'supertest';
import app from '../../docs/examples/simple';
import * as H from '../../src';

jest.mock('express-haste', () => H);

describe('requires', () => {
  it('Should validate the request body', async () => {
    return request(app)
      .post('/pets/123')
      .send({
        type: 'fish',
        breed: 'carp',
        vaccinated: true,
      })
      .expect({
        type: 'about:blank',
        title: 'Bad request',
        detail: 'Request failed to validate',
        issues: [
          {
            code: 'invalid_enum_value',
            path: ['type'],
            message: 'Invalid enum value. Expected \'cat\' | \'dog\', received \'fish\'',
          },
          { code: 'invalid_type', path: ['header', 'authorization'], message: 'Required' },
        ],
      })
      .expect(400);
  });

  it('Should validate the request header exists', async () => {
    return request(app)
      .post('/pets/123')
      .set({ Authorization: 'Basic ZGFzZjphZnNk' })
      .send({
        type: 'cat',
        breed: 'tomcat',
        vaccinated: true,
      })
      .expect({
        status: 201,
        title: 'created',
        details: 'cat/breeds/tomcat',
      })
      .expect(200);
  });

  it('Should return a validation error when cookie is missing', async () => {
    return  request(app)
      .get('/pets?id=123')
      .expect({
        type: 'about:blank',
        title: 'Bad request',
        detail: 'Request failed to validate',
        issues: [
          {
            code: 'invalid_string',
            path: ['query', 'id'],
            message: 'Must be a valid pet identifier.',
          },
        ],
      })
      .expect(400)
    ;
  });

  it('Should return a validation error when query fails to match schema.', async () => {
    return request(app)
      .get('/pets?id=123')
      .expect({
        type: 'about:blank',
        title: 'Bad request',
        detail: 'Request failed to validate',
        issues: [
          {
            code: 'invalid_string',
            path: ['query', 'id'],
            message: 'Must be a valid pet identifier.',
          },
        ],
      });
  });

  it('Should return a validation error when path fails to match schema.', async () => {
    return request(app)
      .get('/pet/123')
      .expect({
        type: 'about:blank',
        title: 'Bad request',
        detail: 'Request failed to validate',
        issues: [{ code: 'invalid_string', path: ['path', 'id'], message: 'Must be a valid pet identifier.' }],
      })
      .expect(400);
  });

  it('Should let the request through when cookie and query is provided', async () => {
    return request(app)
      .get('/pets?id=16655163-72e9-474a-88c5-1eb866594c08')
      .send({
        type: 'cat',
        breed: 'tomcat',
      })
      .expect({ type: 'cat', breed: 'burmese', id: '16655163-72e9-474a-88c5-1eb866594c08', vaccinated: true })
      .expect(200);
  });
  it('Should let the request through when cookie and path is provided', async () => {
    return request(app)
      .get('/pet/16655163-72e9-474a-88c5-1eb866594c08')
      .send({
        type: 'cat',
        breed: 'tomcat',
      })
      .expect({ type: 'cat', breed: 'burmese', id: '16655163-72e9-474a-88c5-1eb866594c08', vaccinated: true })
      .expect(200);
  });
});