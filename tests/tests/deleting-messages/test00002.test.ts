import { getQueueManager } from '../../common/queue-manager';
import { getMessageManager } from '../../common/message-manager';
import {
  createQueue,
  defaultQueue,
  produceMessageWithPriority,
} from '../../common/message-producing-consuming';

test('Combined test: Delete a pending message with priority. Check pending messages. Check queue metrics.', async () => {
  await createQueue(defaultQueue, true);
  const { message, queue } = await produceMessageWithPriority();
  const messageManager = await getMessageManager();
  const res1 = await messageManager.pendingMessages.listAsync(queue, 0, 100);

  expect(res1.total).toBe(1);
  expect(res1.items[0].message.getId()).toBe(message.getRequiredId());

  const queueManager = await getQueueManager();
  const queueMetrics = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(1);

  await messageManager.pendingMessages.deleteAsync(
    queue,
    message.getRequiredId(),
    0,
  );
  const res2 = await messageManager.pendingMessages.listAsync(queue, 0, 100);
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics1.pending).toBe(0);

  // Deleting a message that was already deleted should not throw an error
  await messageManager.pendingMessages.deleteAsync(
    queue,
    message.getRequiredId(),
    0,
  );
});
