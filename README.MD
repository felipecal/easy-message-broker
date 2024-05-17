#  Easy Queue 

- The easy-message-broker library is an HTTP messaging solution designed to simplify and expedite the message exchange process, offering a straightforward and user-friendly approach for users. With the aim of making messaging integration an accessible and efficient task, the easy-message-broker library employs the AMQP (Advanced Message Queuing Protocol) protocol to provide a robust and reliable infrastructure.

- Access the library in NPM: [Easy-Message-Broker](https://www.npmjs.com/package/easy-message-broker).

## Instalação

- Install the lib:

```bash
  npm install easy-message-broker
```

## Usage

- #### How to Import:

```
import { MessageBroker } from 'easy-message-broker';
```

- #### How to import and use:

```
  const queue = new MessageBroker();
```

- #### Example creating queue, exchange, bind and publish message:

```
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
```
async function exampleConsumeQueue() {
  const queue = new MessageBroker();
  await queue.connect('localhost');
  await queue.consumeQueue('testeQueue')
}
```


## Author

- [@felipecal](https://www.github.com/felipecal)

## License

- [MIT](https://choosealicense.com/licenses/mit/)
