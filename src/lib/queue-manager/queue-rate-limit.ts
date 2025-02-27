import {
  EQueueSettingType,
  IRequiredConfig,
  TQueueParams,
  TQueueRateLimit,
} from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { QueueRateLimitError } from './errors/queue-rate-limit.error';
import { Queue } from './queue';
import { RedisClient } from 'redis-smq-common';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';
import { ELuaScriptName } from '../../common/redis-client/redis-client';

export class QueueRateLimit {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;
  protected config: IRequiredConfig;

  constructor(
    config: IRequiredConfig,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.redisClient = redisClient;
    this.logger = logger;
    this.config = config;
  }

  clear(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(this.config, queue);
    const { keyQueueSettings, keyQueueRateLimitCounter } =
      redisKeys.getQueueKeys(queueParams);
    const multi = this.redisClient.multi();
    multi.hdel(keyQueueSettings, EQueueSettingType.RATE_LIMIT);
    multi.del(keyQueueRateLimitCounter);
    multi.exec((err) => cb(err));
  }

  set(
    queue: string | TQueueParams,
    rateLimit: TQueueRateLimit,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getParams(this.config, queue);

    // validating rateLimit params from a javascript client
    const limit = Number(rateLimit.limit);
    if (isNaN(limit) || limit <= 0) {
      cb(
        new QueueRateLimitError(
          `Invalid rateLimit.limit. Expected a positive integer > 0`,
        ),
      );
    }
    const interval = Number(rateLimit.interval);
    if (isNaN(interval) || interval < 1000) {
      cb(
        new QueueRateLimitError(
          `Invalid rateLimit.interval. Expected a positive integer >= 1000`,
        ),
      );
    }
    const validatedRateLimit: TQueueRateLimit = { interval, limit };
    const { keyQueueSettings } = redisKeys.getQueueKeys(queueParams);
    this.redisClient.hset(
      keyQueueSettings,
      EQueueSettingType.RATE_LIMIT,
      JSON.stringify(validatedRateLimit),
      (err) => cb(err),
    );
  }

  get(
    queue: string | TQueueParams,
    cb: ICallback<TQueueRateLimit | null>,
  ): void {
    QueueRateLimit.get(this.config, this.redisClient, queue, cb);
  }

  static hasExceeded(
    redisClient: RedisClient,
    queue: TQueueParams,
    rateLimit: TQueueRateLimit,
    cb: ICallback<boolean>,
  ): void {
    const { limit, interval } = rateLimit;
    const { keyQueueRateLimitCounter } = redisKeys.getQueueKeys(queue);
    redisClient.runScript(
      ELuaScriptName.HAS_QUEUE_RATE_EXCEEDED,
      [keyQueueRateLimitCounter],
      [limit, interval],
      (err, reply) => {
        if (err) cb(err);
        else {
          const hasExceeded = Boolean(reply);
          cb(null, hasExceeded);
        }
      },
    );
  }

  static get(
    config: IRequiredConfig,
    redisClient: RedisClient,
    queue: string | TQueueParams,
    cb: ICallback<TQueueRateLimit | null>,
  ): void {
    const queueParams = Queue.getParams(config, queue);
    const { keyQueueSettings } = redisKeys.getQueueKeys(queueParams);
    redisClient.hget(
      keyQueueSettings,
      EQueueSettingType.RATE_LIMIT,
      (err, reply) => {
        if (err) cb(err);
        else if (!reply) cb(null, null);
        else {
          const rateLimit: TQueueRateLimit = JSON.parse(reply);
          cb(null, rateLimit);
        }
      },
    );
  }
}
