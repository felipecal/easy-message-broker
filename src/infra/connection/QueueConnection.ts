import amqp from 'amqplib';

export default class QueueConnection {
  constructor(url: string){}

  async connect(url: string): Promise<void> {
    await amqp.connect(`amqp://${url}`);
  }
}