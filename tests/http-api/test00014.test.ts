import {
  createQueue,
  defaultQueue,
  ISuperTestResponse,
  produceMessageWithPriority,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/dto/queues/get-messages-response-body.DTO';

test('Deleting a pending messages with priority', async () => {
  await startMonitorServer();
  await createQueue(defaultQueue, true);
  const { message, queue } = await produceMessageWithPriority();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.delete(
      `/api/ns/${queue.ns}/queues/${
        queue.name
      }/pending-messages-with-priority/${message.getRequiredId()}`,
    );
  expect(response1.statusCode).toBe(204);
  expect(response1.body).toEqual({});
});
