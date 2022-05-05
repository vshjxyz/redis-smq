import { promisifyAll } from 'bluebird';
import { Message } from '../../src/system/app/message/message';
import { getProducer, untilMessageAcknowledged } from '../common';
import { Consumer } from '../../src/consumer';

test('Consume messages from different queues using a single consumer instance: case 2', async () => {
  const consumer = promisifyAll(new Consumer());
  await consumer.consumeAsync('test_queue', (msg, cb) => {
    cb();
  });
  await consumer.consumeAsync('another_queue', (msg, cb) => {
    cb();
  });
  await consumer.runAsync();

  const producer = getProducer();
  const msg1 = new Message().setQueue('test_queue').setBody('some data');
  setTimeout(() => {
    producer.produceAsync(msg1);
  }, 1000);
  await untilMessageAcknowledged(consumer, msg1);

  const msg2 = new Message().setQueue('another_queue').setBody('some data');
  setTimeout(() => {
    producer.produceAsync(msg2);
  }, 1000);
  await untilMessageAcknowledged(consumer, msg2);

  await consumer.shutdownAsync();
});
