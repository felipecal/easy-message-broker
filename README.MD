
#  Easy Queue 

- The Easy-Queue library is an HTTP messaging solution designed to simplify and expedite the message exchange process, offering a straightforward and user-friendly approach for users. With the aim of making messaging integration an accessible and efficient task, the Easy-Queue library employs the AMQP (Advanced Message Queuing Protocol) protocol to provide a robust and reliable infrastructure.

## Instalação

- Install the lib

```bash
  npm install easy-queue
```

## Usage

- #### How to Import:

```
import { RabbitMQAdapter } from 'easy-queue';
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
  await queue.bindQueueToExchange('testeQueue', 'TestExchange');
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