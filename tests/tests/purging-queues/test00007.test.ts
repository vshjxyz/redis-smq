import { TQueueParams } from '../../../types';
import { processingQueue } from '../../../src/lib/consumer/consumer-message-handler/processing-queue';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { getQueueManager } from '../../common/queue-manager';
import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming';
import { getConsumer } from '../../common/consumer';

test('Concurrently deleting a message queue and starting a consumer', async () => {
  await createQueue(defaultQueue, false);
  const { queue } = await produceMessage();

  const queueManager = await getQueueManager();

  const consumer = getConsumer();

  const m1 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m1).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: 1,
  });

  // queueManagerInstance.delete() calls queueManager.getQueueProcessingQueues() after validation is passed.
  // Within getQueueProcessingQueues() method, we can take more time than usual to return a response, to allow the
  // consumer to start up. queueManagerInstance.delete() should detect that a consumer has been started and
  // the operation should be cancelled.
  const originalMethod = processingQueue.getQueueProcessingQueues;
  processingQueue.getQueueProcessingQueues = (
    ...args: [
      redisClient: RedisClient,
      queue: TQueueParams,
      cb: ICallback<Record<string, string>>,
    ]
  ): void => {
    setTimeout(() => {
      originalMethod(...args);
    }, 5000);
  };

  await expect(async () => {
    await Promise.all([
      queueManager.queue.deleteAsync(queue),
      consumer.runAsync(),
    ]);
  }).rejects.toThrow('One (or more) of the watched keys has been changed');

  const m2 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m2).toEqual({
    acknowledged: 1,
    deadLettered: 0,
    pending: 0,
  });

  // restore
  processingQueue.getQueueProcessingQueues = originalMethod;
});
