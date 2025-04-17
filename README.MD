#  Easy Queue 

- The easy-message-broker library is an HTTP messaging solution designed to simplify and expedite the message exchange process, offering a straightforward and user-friendly approach for users. With the aim of making messaging integration an accessible and efficient task, the easy-message-broker library employs the AMQP (Advanced Message Queuing Protocol) protocol to provide a robust and reliable infrastructure.

- Access the library in NPM: [Easy-Message-Broker](https://www.npmjs.com/package/easy-message-broker).

## Installation

- Install the lib:

```bash
  npm install easy-message-broker
```

## Usage

- #### How to Import:

```typescript
import { MessageBroker } from 'easy-message-broker';
```

- #### How to import and use:

```typescript
  const queue = new MessageBroker();
```

- #### Example creating queue, exchange, bind and publish message:

```typescript
async function examplePublishMessage() {
  const queue = new MessageBroker();

  await queue.connect('localhost');
  await queue.createQueue('testeQueue')
  await queue.createExchange('testExchange');
  await queue.bindQueueToExchange('testeQueue', 'testExchange');
  await queue.publishMessage('testExchange', '', 'textMessage')
}
```


- #### Example consuming queue:
```typescript
async function exampleConsumeQueue() {
  const queue = new MessageBroker();
  await queue.connect('localhost');
  await queue.consumeQueue('testeQueue', (message) => {
    console.log('Received message:', message);
  });
}
```

## Advanced Features

- #### Connection Options:

```typescript
import { MessageBroker, ConnectionOptions } from 'easy-message-broker';

const connectionOptions: ConnectionOptions = {
  username: 'guest',
  password: 'guest',
  heartbeat: 30,
  vhost: '/',
  tls: false,
  timeout: 30000,
  retry: {
    maxAttempts: 5,
    initialDelay: 1000
  }
};

async function connect() {
  const broker = new MessageBroker();
  await broker.connect('localhost', connectionOptions);
  // ...
}
```

- #### Queue Options:

```typescript
import { MessageBroker, QueueOptions } from 'easy-message-broker';

const queueOptions: QueueOptions = {
  durable: true,
  exclusive: false,
  autoDelete: false,
  arguments: {
    'x-message-ttl': 60000 // 60 seconds TTL
  }
};

async function createQueue() {
  const broker = new MessageBroker();
  await broker.connect('localhost');
  await broker.createQueue('my-queue', queueOptions);
}
```

- #### Exchange Options:

```typescript
import { MessageBroker, ExchangeOptions } from 'easy-message-broker';

const exchangeOptions: ExchangeOptions = {
  type: 'topic', // direct, fanout, topic, headers
  durable: true,
  autoDelete: false
};

async function createExchange() {
  const broker = new MessageBroker();
  await broker.connect('localhost');
  await broker.createExchange('my-exchange', exchangeOptions);
}
```

- #### Publishing with Options:

```typescript
import { MessageBroker, PublishOptions } from 'easy-message-broker';

const publishOptions: PublishOptions = {
  contentType: 'application/json',
  persistent: true,
  expiration: '60000', // 60 seconds
  headers: {
    priority: 'high'
  }
};

async function publishMessage() {
  const broker = new MessageBroker();
  await broker.connect('localhost');
  
  const message = { id: 123, name: 'Test Message' };
  
  await broker.publishMessage('my-exchange', 'routing.key', message, publishOptions);
}
```

- #### Request-Reply Pattern:

```typescript
async function requestResponse() {
  const broker = new MessageBroker();
  await broker.connect('localhost');
  
  // Setup server to respond to requests
  await broker.createExchange('request-exchange');
  await broker.createQueue('request-queue');
  await broker.bindQueueToExchange('request-queue', 'request-exchange', 'requests');
  
  // Consumer that processes requests and sends responses
  await broker.consumeQueue('request-queue', async (message, originalMessage) => {
    console.log('Received request:', message);
    
    // Process request and prepare response
    const response = { result: 'Request processed successfully' };
    
    // Publish to the reply queue provided in the original message
    await broker.publishMessage('', originalMessage.properties.replyTo, response, {
      correlationId: originalMessage.properties.correlationId
    });
  });
  
  // Client making a request
  const request = { action: 'doSomething' };
  const response = await broker.request('request-exchange', 'requests', request, {
    timeout: 5000 // 5 seconds
  });
  
  console.log('Received response:', response);
}
```

- #### Direct Queue Sending:

```typescript
async function sendToQueue() {
  const broker = new MessageBroker();
  await broker.connect('localhost');
  
  await broker.createQueue('direct-queue');
  
  // Send message directly to queue without using exchange
  await broker.sendToQueue('direct-queue', { data: 'Direct message' });
}
```

- #### Error Handling and Closing Connections:

```typescript
async function errorHandlingAndClose() {
  const broker = new MessageBroker();
  
  try {
    await broker.connect('localhost');
    // Perform operations...
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Always close connection when done
    await broker.close();
  }
}
```

## Best Practices

1. **Always close connections**: Use `broker.close()` when done to release resources.
2. **Use error handling**: Wrap operations in try/catch blocks.
3. **Configure persistence**: For important messages, set `persistent: true` in publish options.
4. **Use durable queues**: For queues that should survive server restarts, set `durable: true`.
5. **Configure auto-reconnection**: Use retry options for automatic reconnection attempts.

## Author

- [@felipecal](https://www.github.com/felipecal)

## License

- [MIT](https://choosealicense.com/licenses/mit/)