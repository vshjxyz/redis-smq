import {
  createQueue,
  defaultQueue,
  ISuperTestResponse,
  produceMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/dto/queues/get-messages-response-body.DTO';

test('Delete a message queue', async () => {
  await startMonitorServer();
  await createQueue(defaultQueue, false);
  const { queue } = await produceMessage();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.delete(`/api/ns/${queue.ns}/queues/${queue.name}`);
  expect(response1.statusCode).toBe(204);
  expect(response1.body).toEqual({});
});
