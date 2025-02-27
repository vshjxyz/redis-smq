import { RedisClient } from 'redis-smq-common';
import * as fs from 'fs';

export enum ELuaScriptName {
  ENQUEUE_SCHEDULED_MESSAGE = 'ENQUEUE_SCHEDULED_MESSAGE',
  PUBLISH_MESSAGE = 'PUBLISH_MESSAGE',
  REQUEUE_MESSAGE = 'REQUEUE_MESSAGE',
  SCHEDULE_MESSAGE = 'SCHEDULE_MESSAGE',
  HAS_QUEUE_RATE_EXCEEDED = 'HAS_QUEUE_RATE_EXCEEDED',
  CREATE_QUEUE = 'CREATE_QUEUE',
  INIT_CONSUMER_QUEUE = 'INIT_CONSUMER_QUEUE',
}

RedisClient.addScript(
  ELuaScriptName.ENQUEUE_SCHEDULED_MESSAGE,
  fs.readFileSync(`${__dirname}/lua/enqueue-scheduled-message.lua`).toString(),
);
RedisClient.addScript(
  ELuaScriptName.PUBLISH_MESSAGE,
  fs.readFileSync(`${__dirname}/lua/publish-message.lua`).toString(),
);
RedisClient.addScript(
  ELuaScriptName.REQUEUE_MESSAGE,
  fs.readFileSync(`${__dirname}/lua/requeue-message.lua`).toString(),
);
RedisClient.addScript(
  ELuaScriptName.SCHEDULE_MESSAGE,
  fs.readFileSync(`${__dirname}/lua/schedule-message.lua`).toString(),
);
RedisClient.addScript(
  ELuaScriptName.HAS_QUEUE_RATE_EXCEEDED,
  fs.readFileSync(`${__dirname}/lua/has-queue-rate-exceeded.lua`).toString(),
);
RedisClient.addScript(
  ELuaScriptName.CREATE_QUEUE,
  fs.readFileSync(`${__dirname}/lua/create-queue.lua`).toString(),
);
RedisClient.addScript(
  ELuaScriptName.INIT_CONSUMER_QUEUE,
  fs.readFileSync(`${__dirname}/lua/init-consumer-queue.lua`).toString(),
);
