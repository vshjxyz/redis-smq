import { RedisClient } from 'redis-smq-common';
import {
  EQueueType,
  IRequiredConfig,
  TGetMessagesReply,
  TQueueParams,
} from '../../../../types';
import { Queue } from '../../queue-manager/queue';
import { PendingPriorityMessages } from './pending-priority-messages';
import { PendingNonPriorityMessages } from './pending-non-priority-messages';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class PendingMessages {
  protected redisClient: RedisClient;
  protected pendingPriorityMessages: PendingPriorityMessages;
  protected pendingNonPriorityMessages: PendingNonPriorityMessages;
  protected config: IRequiredConfig;

  constructor(
    config: IRequiredConfig,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.redisClient = redisClient;
    this.config = config;
    this.pendingNonPriorityMessages = new PendingNonPriorityMessages(
      config,
      redisClient,
      logger,
    );
    this.pendingPriorityMessages = new PendingPriorityMessages(
      config,
      redisClient,
      logger,
    );
  }

  purge(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(this.config, queue);
    Queue.getSettings(
      this.config,
      this.redisClient,
      queueParams,
      (err, settings) => {
        if (err) cb(err);
        else if (settings?.type === EQueueType.PRIORITY_QUEUE) {
          this.pendingPriorityMessages.purge(queueParams, cb);
        } else {
          this.pendingNonPriorityMessages.purge(queueParams, cb);
        }
      },
    );
  }

  list(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    Queue.getSettings(this.config, this.redisClient, queue, (err, settings) => {
      if (err) cb(err);
      else if (settings?.type === EQueueType.PRIORITY_QUEUE) {
        this.pendingPriorityMessages.list(queue, skip, take, cb);
      } else {
        this.pendingNonPriorityMessages.list(queue, skip, take, cb);
      }
    });
  }

  delete(
    queue: string | TQueueParams,
    messageId: string,
    sequenceId: number,
    cb: ICallback<void>,
  ): void {
    Queue.getSettings(this.config, this.redisClient, queue, (err, settings) => {
      if (err) cb(err);
      else if (settings?.type === EQueueType.PRIORITY_QUEUE) {
        this.pendingPriorityMessages.delete(queue, messageId, cb);
      } else {
        this.pendingNonPriorityMessages.delete(
          queue,
          messageId,
          sequenceId,
          cb,
        );
      }
    });
  }

  count(queue: string | TQueueParams, cb: ICallback<number>): void {
    Queue.getSettings(this.config, this.redisClient, queue, (err, settings) => {
      if (err) cb(err);
      else if (settings?.type === EQueueType.PRIORITY_QUEUE)
        this.pendingPriorityMessages.count(queue, cb);
      else this.pendingNonPriorityMessages.count(queue, cb);
    });
  }
}
