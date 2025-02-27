import { AbstractMessageStorage } from './abstract-message-storage';
import { TGetMessagesReply } from '../../../../types';
import { Message } from '../../message/message';
import { async, errors } from 'redis-smq-common';
import { MessageNotFoundError } from '../errors/message-not-found.error';
import { ICallback } from 'redis-smq-common/dist/types';

type TSortedSetKeyMessagesParams = {
  keyMessages: string;
  keyMessagesWeight: string;
};

type TSortedSetMessageIdParams = {
  messageId: string;
};

export abstract class SortedSetMessageStorage extends AbstractMessageStorage<
  TSortedSetKeyMessagesParams,
  TSortedSetMessageIdParams
> {
  protected override deleteMessage(
    key: TSortedSetKeyMessagesParams,
    id: TSortedSetMessageIdParams,
    cb: ICallback<void>,
  ): void {
    const { keyMessages, keyMessagesWeight } = key;
    const { messageId } = id;
    // Not checking message existence.
    // If the message exists it will be deleted.
    // Otherwise, assuming that it has been already deleted
    const multi = this.redisClient.multi();
    multi.hdel(keyMessages, messageId);
    multi.zrem(keyMessagesWeight, messageId);
    multi.exec((err) => cb(err));
  }

  protected override fetchMessages(
    key: TSortedSetKeyMessagesParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.validatePaginationParams(skip, take);
    const { keyMessages, keyMessagesWeight } = key;
    const getMessages = (
      reply: { total: number; items: string[] },
      cb: ICallback<TGetMessagesReply>,
    ) => {
      if (!reply.total || !reply.items.length)
        cb(null, { total: reply.total, items: [] });
      else {
        this.redisClient.hmget(keyMessages, reply.items, (err, msg) => {
          if (err) cb(err);
          else {
            const items: TGetMessagesReply['items'] = [];
            async.each(
              msg ?? [],
              (item, index, done) => {
                if (!item) done(new errors.EmptyCallbackReplyError());
                else {
                  items.push({
                    sequenceId: skip + Number(index),
                    message: Message.createFromMessage(item),
                  });
                  done();
                }
              },
              (err) => {
                if (err) cb(err);
                else {
                  cb(null, {
                    total: reply.total,
                    items,
                  });
                }
              },
            );
          }
        });
      }
    };
    const getMessageIds = (
      total: number,
      cb: ICallback<{ total: number; items: string[] }>,
    ) => {
      if (!total) cb(null, { total, items: [] });
      else {
        this.redisClient.zrange(
          keyMessagesWeight,
          skip,
          skip + take - 1,
          (err, items) => {
            if (err) cb(err);
            else cb(null, { total, items: items ?? [] });
          },
        );
      }
    };
    async.waterfall(
      [
        (cb: ICallback<number>) => this.countMessages(key, cb),
        getMessageIds,
        getMessages,
      ],
      cb,
    );
  }

  protected override purgeMessages(
    key: TSortedSetKeyMessagesParams,
    cb: ICallback<void>,
  ): void {
    const { keyMessages, keyMessagesWeight } = key;
    const multi = this.redisClient.multi();
    multi.del(keyMessages);
    multi.del(keyMessagesWeight);
    multi.exec((err) => cb(err));
  }

  protected override getMessageById(
    key: TSortedSetKeyMessagesParams,
    id: TSortedSetMessageIdParams,
    cb: ICallback<Message>,
  ): void {
    const { keyMessages } = key;
    const { messageId } = id;
    this.redisClient.hget(keyMessages, messageId, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new MessageNotFoundError());
      else cb(null, Message.createFromMessage(reply));
    });
  }

  protected override countMessages(
    key: TSortedSetKeyMessagesParams,
    cb: ICallback<number>,
  ): void {
    const { keyMessagesWeight } = key;
    this.redisClient.zcard(keyMessagesWeight, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply ?? 0);
    });
  }
}
