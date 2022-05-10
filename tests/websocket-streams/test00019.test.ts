import {
  createQueue,
  defaultQueue,
  getConsumer,
  listenForWebsocketStreamEvents,
  startWebsocketOnlineStreamWorker,
  validateTime,
} from '../common';

test('WebsocketOnlineStreamWorker: streamOnlineQueueConsumers/case 2', async () => {
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();
  await consumer.runAsync();

  const data = await listenForWebsocketStreamEvents<Record<string, string>>(
    `streamOnlineQueueConsumers:${defaultQueue.ns}:${defaultQueue.name}`,
    startWebsocketOnlineStreamWorker,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(Object.keys(data[i].payload)).toEqual([consumer.getId()]);
  }

  await consumer.shutdownAsync();

  const data2 = await listenForWebsocketStreamEvents<Record<string, string>>(
    `streamOnlineQueueConsumers:${defaultQueue.ns}:${defaultQueue.name}`,
    startWebsocketOnlineStreamWorker,
  );
  for (let i = 0; i < data2.length; i += 1) {
    const diff = data2[i].ts - data2[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(data2[i].payload).toEqual({});
  }
});
