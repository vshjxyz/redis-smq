import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { getMessageManager } from '../../common/message-manager';
import { untilConsumerEvent } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('Shutdown a consumer when consuming a message with retryThreshold = 0: expect the message to be dead-lettered', async () => {
  await createQueue(defaultQueue, false);

  const consumer = getConsumer({
    messageHandler: jest.fn(() => {
      setTimeout(() => consumer.shutdown(), 5000);
    }),
  });

  const msg = new Message()
    .setRetryThreshold(0)
    .setBody('message body')
    .setQueue(defaultQueue);
  const producer = getProducer();
  await producer.runAsync();
  await producer.produceAsync(msg);

  consumer.run();
  await untilConsumerEvent(consumer, events.DOWN);
  const messageManager = await getMessageManager();
  const res = await messageManager.deadLetteredMessages.listAsync(
    defaultQueue,
    0,
    99,
  );
  expect(res.total).toBe(1);
  expect(typeof res.items[0].message.getId()).toBe('string');
  expect(res.items[0].message.getId()).toBe(msg.getId());
});
