# Consumer Class API

```javascript
const { Consumer } = require('redis-smq');
```

## Table of Content

1. [Consumer.prototype.constructor()](#consumerprototypeconstructor)
2. [Consumer.prototype.consume()](#consumerprototypeconsume)
3. [Consumer.prototype.cancel()](#consumerprototypecancel)
4. [Consumer.prototype.getQueues()](#consumerprototypegetqueues)
5. [Consumer.prototype.run()](#consumerprototyperun)
6. [Consumer.prototype.shutdown()](#consumerprototypeshutdown)
7. [Other methods](#other-methods)

## Public Methods

### Consumer.prototype.constructor()

**Syntax**

```javascript
constructor(useMultiplexing)
```

**Parameters**
- `useMultiplexing` *(boolean): Optional.*  Enables multiplexing for the given consumer instance. See [Multiplexing](docs/multiplexing.md) for more details. By default, multiplexing is not enabled.

### Consumer.prototype.consume()

**Syntax**

```javascript
consume(queue, messageHandler, cb);
```

**Parameters**

- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `messageHandler(message, cb)` *(function): Required.* 
  - `message` *(mixed): Required.* A message instance.
  - `cb(err)` *(function): Required.* Callback function. If the message has successfully processed, you can acknowledge it by calling the callback function without arguments. Otherwise, if any error has occurred, the message is unacknowledged by returning the error as the first argument of the callback function.
- `cb(err, isRunning)` *(function): Required.* Callback function. 
  - `err` *(Error | null | undefined).* Error object.
  - `isRunning` *(boolean): Required.* Indicates whether the message handler is currently running. If your consumer is up and running, then the message handler will be started after being registered.
  
Before consuming messages from a queue, make sure that such queue exists.

### Consumer.prototype.cancel()

```javascript
cancel(queue, cb);
```

**Parameters**

- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(function): Required.* Callback function.

### Consumer.prototype.getQueues()

```javascript
getQueues(cb);
```

**Parameters**

- `cb(err, queues)` *(function): Required.* Callback function. 
  - `err` *(Error | null | undefined).* Error object.
  - `queues` *(Array).*
    - `queues[*].usingPriorityQueuing` *(boolean).*
    - `queues[*].queue` *(object).*
    - `queues[*].queue.name` *(string): Required.* Queue name.
    - `queues[*].queue.ns` *(string): Required.* Queue namespace.

### Consumer.prototype.run()

Run your consumer instance and start consuming messages. No connection to Redis server is opened until this method is called.

**Syntax**

```javascript
run(cb);
```

**Parameters**
- `cb(err, status)` *(function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `status` *(boolean).* Indicate whether the operation completed successfully.

### Consumer.prototype.shutdown()

Gracefully shut down your consumer instance and go offline.

**Syntax**

```javascript
shutdown(cb);
```

**Parameters**
- `cb(err, status)` *(function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `status` *(boolean).* Indicate whether the operation completed successfully.

### Other Methods

- Consumer.prototype.getId()
- Consumer.prototype.isGoingUp()
- Consumer.prototype.isGoingDown()
- Consumer.prototype.isUp()
- Consumer.prototype.isDown()
- Consumer.prototype.isRunning()
