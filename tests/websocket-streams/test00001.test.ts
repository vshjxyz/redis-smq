import { getRedisInstance, startWebsocketMainStreamWorker } from '../common';
import { TWebsocketMainStreamPayload } from '../../types';

test('WebsocketMainStreamWorker: Case 1', async () => {
  await startWebsocketMainStreamWorker();

  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe('streamMain');

  const json = await new Promise<TWebsocketMainStreamPayload>((resolve) => {
    subscribeClient.on('message', (channel, message) => {
      const json: TWebsocketMainStreamPayload = JSON.parse(message);
      resolve(json);
    });
  });

  expect(json).toEqual({
    scheduledMessagesCount: 0,
    deadLetteredMessagesCount: 0,
    pendingMessagesCount: 0,
    acknowledgedMessagesCount: 0,
    consumersCount: 0,
    queuesCount: 0,
    queues: {},
  });
});
