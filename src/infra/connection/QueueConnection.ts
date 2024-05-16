import amqp from 'amqplib';

export default class QueueConnection {
  constructor(private url: string){}

  async connect(): Promise<void> {
    await amqp.connect(`amqp://${this.url}`);
  }
}