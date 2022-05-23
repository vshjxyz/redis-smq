import { ICallback, IConsumerWorkerParameters } from '../../types';
import { ConsumerHeartbeat } from '../lib/consumer/consumer-heartbeat';
import { Worker } from '../common/worker/worker';
import { waterfall } from '../common/async/async';

export class HeartbeatMonitorWorker extends Worker<IConsumerWorkerParameters> {
  work = (cb: ICallback<void>): void => {
    waterfall(
      [
        (cb: ICallback<string[]>): void =>
          ConsumerHeartbeat.getExpiredHeartbeatIds(this.redisClient, cb),
        (consumerIds: string[], cb: ICallback<void>): void => {
          ConsumerHeartbeat.handleExpiredHeartbeatIds(
            this.redisClient,
            consumerIds,
            cb,
          );
        },
      ],
      cb,
    );
  };
}

export default HeartbeatMonitorWorker;
