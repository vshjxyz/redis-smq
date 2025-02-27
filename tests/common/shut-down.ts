import { shutDownConsumers } from './consumer';
import { shutDownProducers } from './producer';
import { stopScheduleWorker } from './schedule-worker';
import { shutDownMessageManager } from './message-manager';
import { shutDownQueueManager } from './queue-manager';
import { shutDownRedisClients } from './redis';
import { shutDownFanOutExchangeManager } from './fanout-exchange-manager';

export async function shutdown(): Promise<void> {
  await shutDownConsumers();
  await shutDownProducers();
  await stopScheduleWorker();
  await shutDownMessageManager();
  await shutDownQueueManager();
  await shutDownFanOutExchangeManager();

  // Redis clients should be stopped in the last step, to avoid random errors from different
  // dependant components.
  await shutDownRedisClients();
}
