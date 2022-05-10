import {
  createQueue,
  defaultQueue,
  ISuperTestResponse,
  produceMessageWithPriority,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetPendingMessagesWithPriorityResponseBodyDataDTO } from '../../src/monitor-server/controllers/api/namespaces/queue/pending-messages-with-priority/get-pending-messages-with-priority/get-pending-messages-with-priority.response.DTO';

test('Fetching pending messages with priority', async () => {
  await startMonitorServer();
  await createQueue(defaultQueue, true);
  const { message, queue } = await produceMessageWithPriority();

  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetPendingMessagesWithPriorityResponseBodyDataDTO> =
    await request.get(
      `/api/ns/${queue.ns}/queues/${queue.name}/pending-messages-with-priority?skip=0&take=99`,
    );

  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.total).toBe(1);
  expect(response1.body.data?.items.length).toBe(1);
  expect(response1.body.data?.items[0].metadata?.uuid).toBe(
    message.getRequiredId(),
  );
});
