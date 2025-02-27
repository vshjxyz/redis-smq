import { delay } from 'bluebird';
import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { getQueueManager } from '../../common/queue-manager';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import { validateTime } from '../../common/validate-time';
import { defaultQueue } from '../../common/message-producing-consuming';

test('Rate limit a priority queue and check message rate', async () => {
  const qm = await getQueueManager();
  await qm.queue.createAsync(defaultQueue, true);

  await qm.queueRateLimit.setAsync(defaultQueue, {
    limit: 3,
    interval: 10000,
  });

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(
    new Message()
      .setBody('msg 1')
      .setQueue(defaultQueue)
      .setPriority(Message.MessagePriority.HIGH),
  );
  await producer.produceAsync(
    new Message()
      .setBody('msg 2')
      .setQueue(defaultQueue)
      .setPriority(Message.MessagePriority.HIGH),
  );
  await producer.produceAsync(
    new Message()
      .setBody('msg 3')
      .setQueue(defaultQueue)
      .setPriority(Message.MessagePriority.HIGH),
  );
  await producer.produceAsync(
    new Message()
      .setBody('msg 4')
      .setQueue(defaultQueue)
      .setPriority(Message.MessagePriority.HIGH),
  );
  await producer.produceAsync(
    new Message()
      .setBody('msg 5')
      .setQueue(defaultQueue)
      .setPriority(Message.MessagePriority.HIGH),
  );
  await producer.produceAsync(
    new Message()
      .setBody('msg 6')
      .setQueue(defaultQueue)
      .setPriority(Message.MessagePriority.HIGH),
  );

  const messages: { ts: number; msg: Message }[] = [];
  const consumer = await getConsumer();
  await consumer.cancelAsync(defaultQueue);
  await consumer.consumeAsync(defaultQueue, (msg, cb) => cb());

  consumer.on(events.MESSAGE_ACKNOWLEDGED, (msg: Message) => {
    messages.push({ ts: Date.now(), msg });
  });

  await consumer.runAsync();
  await delay(25000);

  expect(messages.length).toBe(6);

  const diff1 = messages[1].ts - messages[0].ts;
  expect(validateTime(diff1, 0)).toBe(true);

  const diff2 = messages[2].ts - messages[1].ts;
  expect(validateTime(diff2, 0)).toBe(true);

  const diff3 = messages[3].ts - messages[2].ts;
  expect(validateTime(diff3, 10000)).toBe(true);

  const diff4 = messages[4].ts - messages[3].ts;
  expect(validateTime(diff4, 0)).toBe(true);

  const diff5 = messages[5].ts - messages[4].ts;
  expect(validateTime(diff5, 0)).toBe(true);
});
