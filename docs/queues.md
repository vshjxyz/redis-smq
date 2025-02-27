# Queues

A queue is responsible for holding messages which are produced by producers and are delivered to consumers.

RedisSMQ supports **3 types** of queues:

 - **LIFO (Last In, First Out) queue**: In a LIFO queue the last published messages are always delivered first and the first published messages are delivered last. 
 - **FIFO (First In, First Out) queue**: In a FIFO queue the first published messages are delivered first and the last published messages are delivered last.
 - **Priority queues**: When enabled, messages with higher priority are always delivered first before messages with lower priority. 

Both LIFO and FIFO queues use [brpoplpush](https://redis.io/commands/brpoplpush), which blocks the connection to the Redis server until a message is received. However, priority queues use pooling and lua scripting which introduce a little of overhead on the MQ and therefore priority queues are less performant than other queue types.

## Queue Namespace

Queues in RedisSMQ are namespaced. 

A queue namespace is used as a scope for a given set of queues to ensure unique queue names and to avoid **name collisions** when multiple queues share the same name.

A given queue can be either identified by a queue name like `orders` or explicitly by its queue name and namespace for example `{ ns: 'my-app', name: 'orders' }`.

By default, when a namespace for a queue is not specified, the queue is assigned to the **default** namespace.

The default namespace can be configured from your configuration object. See [Configuration](/docs/configuration.md) for more details.

## Queue Naming Requirements

A queue name is required to fulfill the following requirements:

- To be composed of alphanumeric characters `[a-z0-9]` for example `queue$` is an invalid queue name;
- May include `-` and `_` characters for example `my-queue` or `my_queue` are valid queue names;
- To start with an alpha character `[a-z]` and ends with an alphanumeric character `[a-z0-9]` for example `3queue` or `my_queue_` are invalid queue names;
- Is allowed to include dots (`.`) for denoting queues hierarchy for example `sports.football`. See [Topic Exchange](/docs/message-exchanges.md#topic-exchange);

## Managing Queues and Namespaces

Queues and Namespaces can be managed using the [QueueManager](/docs/api/queue-manager.md) which provides the following methods:

1. [QueueManager.prototype.namespace.list()](/docs/api/queue-manager.md#queuemanagerprototypenamespacelist): To retrieve the list of namespaces.
2. [QueueManager.prototype.namespace.getQueues()](/docs/api/queue-manager.md#queuemanagerprototypenamespacegetqueues): To retrieve the list of queues of a given namespace.
3. [QueueManager.prototype.namespace.delete()](/docs/api/queue-manager.md#queuemanagerprototypenamespacedelete): To delete a namespace alongside with its queues.
4. [QueueManager.prototype.queue.save()](/docs/api/queue-manager.md#queuemanagerprototypequeuesave): To create a queue.
5. [QueueManager.prototype.queue.list()](/docs/api/queue-manager.md#queuemanagerprototypequeuelist): To retrieve the list of queues from all namespaces.
6. [QueueManager.prototype.queue.delete()](/docs/api/queue-manager.md#queuemanagerprototypequeuedelete): To delete a queue.
7. [QueueManager.prototype.queue.exists()](/docs/api/queue-manager.md#queuemanagerprototypequeueexists): To check of a queue exists.
8. [QueueManager.prototype.queue.getSettings()](/docs/api/queue-manager.md#queuemanagerprototypequeuegetsettings): To retrieve settings of a given queue. 

## LIFO Queues

Creating a LIFO queue named 'lifo_queue' in the 'default' namespace.

```javascript
const { QueueManager } = require('redis-smq');

QueueManager.createInstance(config, (err, queueManager) => {
  if (err) console.log(err);
  else queueManager.queue.save('lifo_queue', EQueueType.LIFO_QUEUE, (err) => console.log(err));
})
```

See [QueueManager.prototype.queue.save()](/docs/api/queue-manager.md#queuemanagerprototypequeuesave) for more details.

## FIFO Queues

Creating a FIFO queue named 'fifo_queue' in the 'default' namespace.

```javascript
const { QueueManager } = require('redis-smq');

QueueManager.createInstance(config, (err, queueManager) => {
  if (err) console.log(err);
  else queueManager.queue.save('fifo_queue', EQueueType.FIFO_QUEUE, (err) => console.log(err));
})
```

See [QueueManager.prototype.queue.save()](/docs/api/queue-manager.md#queuemanagerprototypequeuesave) for more details.

## Priority Queues

Creating a FIFO queue named 'priority_queue' in the 'default' namespace.

```javascript
const { QueueManager } = require('redis-smq');

QueueManager.createInstance(config, (err, queueManager) => {
  if (err) console.log(err);
  else queueManager.queue.save('priority_queue', EQueueType.PRIORITY_QUEUE, (err) => console.log(err));
})
```

### Setting Up a Message Priority

To set up a message priority, the [Message API](/docs/api/message.md) provides the following methods:

* [Message.prototype.setPriority()](/docs/api/message.md#messageprototypesetpriority)
* [Message.prototype.getPriority()](/docs/api/message.md#messageprototypegetpriority)

See [Message Priority](/docs/api/message.md#messagemessagepriority) for more details.

### Producing Messages

Before producing a message with a priority, make sure that the destination queues of the message has priority queuing enabled. Otherwise, an error will be returned.

```javascript
const { Message } = require('redis-smq');

const msg1 = new Message();
msg1.setPriority(Message.MessagePriority.HIGH).setQueue('test_queue');
producer.produce(msg1, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});
```

To learn more about the destination queues of a message see [Message Exchanges](/docs/message-exchanges.md).

### Consuming Messages

Consuming messages from a priority queue works as usually without any extra settings.

```javascript
'use strict';
const { Consumer } = require('redis-smq');

const consumer = new Consumer();
consumer.consume('test_queue', (msg, cb) => cb(), (err) => console.log(error));
consumer.run();
```
