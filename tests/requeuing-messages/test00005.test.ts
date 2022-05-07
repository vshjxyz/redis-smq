import {
  getMessageManager,
  getQueueManager,
  produceAndDeadLetterMessage,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test(`Combined test: Dead-letter a message and requeue it with priority. Check pending, acknowledged and pending messages.`, async () => {
  const { queue, message, consumer } = await produceAndDeadLetterMessage();
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getPendingMessagesAsync(queue, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getAcknowledgedMessagesAsync(queue, 0, 100);
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const res3 = await messageManager.getDeadLetteredMessagesAsync(queue, 0, 100);
  expect(res3.total).toBe(1);
  expect(res3.items.length).toBe(1);
  expect(res3.items[0].message.getId()).toEqual(message.getRequiredId());
  expect(res3.items[0].message.getRequiredMetadata().getAttempts()).toEqual(2);

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.pendingWithPriority).toBe(0);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(0);
  expect(queueMetrics.deadLettered).toBe(1);

  await messageManager.requeueDeadLetteredMessageAsync(
    queue,
    0,
    message.getRequiredId(),
    Message.MessagePriority.HIGHEST,
  );

  const res5 = await messageManager.getPendingMessagesAsync(queue, 0, 100);
  expect(res5.total).toBe(0);
  expect(res5.items.length).toBe(0);

  const res6 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );
  expect(res6.total).toBe(1);
  expect(res6.items.length).toBe(1);

  expect(res6.items[0].getId()).toEqual(message.getRequiredId());
  expect(res6.items[0].getPriority()).toEqual(Message.MessagePriority.HIGHEST);
  expect(res6.items[0].getRequiredMetadata().getAttempts()).toEqual(0);

  const res7 = await messageManager.getDeadLetteredMessagesAsync(queue, 0, 100);
  expect(res7.total).toBe(0);
  expect(res7.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics1.deadLettered).toBe(0);
  expect(queueMetrics1.pending).toBe(0);
  expect(queueMetrics1.pendingWithPriority).toBe(1);

  await expect(async () => {
    await messageManager.requeueDeadLetteredMessageAsync(
      queue,
      0,
      message.getRequiredId(),
      Message.MessagePriority.HIGHEST,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
