import amqp from 'amqplib';

export class MessageBroker {
  private connection: any;

  async connect(url: string): Promise<void> {
    try {
      this.connection = await amqp.connect(`amqp://${url}`);
    } catch (error) {
      throw new Error('Error connecting to RabbitMQ: ' + error);
    }
  }

  async publish(exchangeName: string, data: any): Promise<void> {
    try {
      const channel = await this.connection.createChannel();
      await channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)));
    } catch (error) {
      throw new Error('Error publishing message: ' + error);
    }
  }

  async consume(queueName: string, callback: Function): Promise<void> {
    try {
      const channel = await this.connection.createChannel();
      channel.consume(queueName, async (msg: any) => {
        const input = JSON.parse(msg.content.toString());
        await callback(input);
        await channel.ack(msg);
      });
    } catch (error) {
      throw new Error('Error consuming message: ' + error);
    }
  }

  async createExchange(queueName: string, exchangeType: string = 'direct', durable: boolean = true): Promise<void> {
    try {
      const channel = await this.connection.createChannel();
      await channel.assertExchange(queueName, exchangeType, { durable: durable });
    } catch (error) {
      throw new Error('Error creating exchange: ' + error);
    }
  }

  async createQueue(queueName: string, durable: boolean = true): Promise<void> {
    try {
      const channel = await this.connection.createChannel();
      await channel.assertQueue(queueName, { durable: durable });
    } catch (error) {
      throw new Error('Error creating queue: ' + error);
    }
  }

  async bindQueueToExchange(queueName: string, exchangeName: string, routingKey: string = ''): Promise<void> {
    try {
      const channel = await this.connection.createChannel();
      await channel.bindQueue(queueName, exchangeName, routingKey);
    } catch (error) {
      throw new Error('Error binding queue to exchange: ' + error);
    }
  }

  async publishMessage(exchangeName: string, routingKey: string = '', message: any): Promise<void> {
    try {
      const channel = await this.connection.createChannel();
      channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)));
    } catch (error) {
      throw new Error('Error publishing message: ' + error);
    }
  }

  async consumeQueue(queueName: string): Promise<any> {
    try {
      const channel = await this.connection.createChannel();
      channel.consume(queueName, function (msg: any) {
        const input = JSON.parse(msg.content.toString());
        console.log(input);
        // channel.ack(msg);
      });
    } catch (error) {
      throw new Error('Error consuming queue: ' + error);
    }
  }
}
