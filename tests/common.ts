import { promisifyAll } from 'bluebird';
import { events } from '../src/events';
import { RedisClient } from '../src/redis-client';
import {
  Producer,
  Consumer,
  Message,
  MonitorServer,
  MessageProvider,
} from '../index';
import { config } from './config';
import { ICallback, IConfig, TConsumerOptions } from '../types';
import { StatsAggregatorThread } from '../src/monitor-server/threads/stats-aggregator.thread';

type TMonitorServer = ReturnType<typeof MonitorServer>;

class TestConsumer extends Consumer {
  // eslint-disable-next-line class-methods-use-this
  consume(message: Message, cb: ICallback<void>) {
    cb(null);
  }
}

const redisClients: RedisClient[] = [];
const consumersList: Consumer[] = [];
const producersList: Producer[] = [];
let monitorServer: TMonitorServer | null = null;
let statsAggregator: ReturnType<typeof StatsAggregatorThread> | null = null;
let messageProvider: MessageProvider | null = null;

export async function startUp(): Promise<void> {
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
}

export async function shutdown(): Promise<void> {
  const p = async (list: (Consumer | Producer)[]) => {
    for (const i of list) {
      if (i.isRunning()) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          i.shutdown(resolve);
        });
      }
    }
  };
  await p(consumersList);
  await p(producersList);
  while (redisClients.length) {
    const redisClient = redisClients.pop();
    if (redisClient) {
      redisClient.end(true);
    }
  }
  if (messageProvider) {
    messageProvider.quit();
    messageProvider = null;
  }
  await stopMonitorServer();
  await stopStatsAggregator();
}

export function getConsumer({
  queueName = 'test_queue',
  cfg = config,
  options = {},
  consumeMock = null,
}: {
  queueName?: string;
  cfg?: IConfig;
  options?: Partial<TConsumerOptions>;
  consumeMock?: ((msg: Message, cb: ICallback<void>) => void) | null;
} = {}) {
  const consumer = new TestConsumer(queueName, cfg, {
    messageRetryDelay: 0,
    ...options,
  });
  if (consumeMock) {
    consumer.consume = consumeMock;
  }
  const c = promisifyAll(consumer);
  consumersList.push(c);
  return c;
}

export function getProducer(queueName = 'test_queue', cfg = config) {
  const producer = new Producer(queueName, cfg);
  const p = promisifyAll(producer);
  producersList.push(p);
  return p;
}

export async function getMessageProvider(cfg = config) {
  if (!messageProvider) {
    messageProvider = await new Promise<MessageProvider>((resolve) => {
      MessageProvider.getInstance(cfg, (messageProvider) => {
        resolve(messageProvider);
      });
    });
  }
  return messageProvider;
}

export async function startMonitorServer(): Promise<void> {
  await new Promise<void>((resolve) => {
    monitorServer = MonitorServer(config);
    monitorServer.listen(() => {
      resolve();
    });
  });
}

export async function stopMonitorServer(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (monitorServer) {
      monitorServer.quit(() => {
        monitorServer = null;
        resolve();
      });
    } else resolve();
  });
}

export async function startStatsAggregator(): Promise<void> {
  return new Promise<void>((resolve) => {
    statsAggregator = StatsAggregatorThread(config);
    statsAggregator.start(() => {
      monitorServer = null;
      resolve();
    });
  });
}

export async function stopStatsAggregator(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (statsAggregator) {
      statsAggregator.shutdown(() => {
        monitorServer = null;
        resolve();
      });
    } else resolve();
  });
}

export function validateTime(
  actualTime: number,
  expectedTime: number,
  driftTolerance = 3000,
): boolean {
  return (
    actualTime >= expectedTime - driftTolerance &&
    actualTime <= expectedTime + driftTolerance
  );
}

export async function getRedisInstance() {
  const c = promisifyAll(
    await new Promise<RedisClient>((resolve) =>
      RedisClient.getInstance(config, resolve),
    ),
  );
  redisClients.push(c);
  return c;
}

export async function consumerOnEvent(
  consumer: Consumer,
  event: string,
): Promise<void> {
  return new Promise<void>((resolve) => {
    consumer.once(event, () => {
      resolve();
    });
  });
}

export async function untilConsumerIdle(consumer: Consumer): Promise<void> {
  return consumerOnEvent(consumer, events.IDLE);
}

export async function untilConsumerUp(consumer: Consumer): Promise<void> {
  return consumerOnEvent(consumer, events.UP);
}

export async function untilMessageAcknowledged(
  consumer: Consumer,
): Promise<void> {
  return consumerOnEvent(consumer, events.MESSAGE_ACKNOWLEDGED);
}

export async function untilConsumerEvent(
  consumer: Consumer,
  event: string,
): Promise<void> {
  return consumerOnEvent(consumer, event);
}
