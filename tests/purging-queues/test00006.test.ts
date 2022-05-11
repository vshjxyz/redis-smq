import {
  createQueue,
  defaultQueue,
  getQueueManager,
  produceAndAcknowledgeMessage,
} from '../common';

test('Deleting a message queue with all of its data', async () => {
  await createQueue(defaultQueue, false);
  const { consumer, queue } = await produceAndAcknowledgeMessage();

  const queueManager = await getQueueManager();

  const m1 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m1.acknowledged).toBe(1);

  await expect(queueManager.queue.deleteQueueAsync(queue)).rejects.toThrow(
    'Before deleting a queue/namespace, make sure it is not used by a message handler',
  );

  await consumer.shutdownAsync();
  await queueManager.queue.deleteQueueAsync(queue);

  await expect(
    queueManager.queueMetrics.getQueueMetricsAsync(queue),
  ).rejects.toThrow('Queue does not exist');

  await expect(queueManager.queue.deleteQueueAsync(queue)).rejects.toThrow(
    'Queue does not exist',
  );
});
