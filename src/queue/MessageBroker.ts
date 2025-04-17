import amqp, { Connection, Channel, Options, ConsumeMessage } from "amqplib";

export interface ConnectionOptions {
  username?: string;
  password?: string;
  heartbeat?: number;
  vhost?: string;
  tls?: boolean;
  timeout?: number;
  retry?: {
    maxAttempts: number;
    initialDelay: number;
  };
}

export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: any;
}

export interface ExchangeOptions {
  type?: string;
  durable?: boolean;
  autoDelete?: boolean;
  internal?: boolean;
  arguments?: any;
}

export interface PublishOptions {
  contentType?: string;
  contentEncoding?: string;
  persistent?: boolean;
  expiration?: string;
  headers?: any;
}

export class MessageBroker {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private connecting: boolean = false;
  private connectionPromise: Promise<Connection> | null = null;

  async connect(url: string, options?: ConnectionOptions): Promise<Connection> {
    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;

    const defaultOptions: ConnectionOptions = {
      username: "guest",
      password: "guest",
      heartbeat: 30,
      vhost: "/",
      tls: false,
      timeout: 30000,
      retry: {
        maxAttempts: 5,
        initialDelay: 1000,
      },
    };

    const connectionOptions = { ...defaultOptions, ...options };
    const protocol = connectionOptions.tls ? "amqps" : "amqp";

    try {
      this.connectionPromise = this.createConnection(
        `${protocol}://${connectionOptions.username}:${connectionOptions.password}@${url}/${connectionOptions.vhost}?heartbeat=${connectionOptions.heartbeat}`,
        connectionOptions
      );

      this.connection = await this.connectionPromise;
      this.connecting = false;

      this.connection.on("error", this.handleConnectionError.bind(this));
      this.connection.on("close", this.handleConnectionClosed.bind(this));

      return this.connection;
    } catch (error) {
      this.connecting = false;
      this.connectionPromise = null;
      throw new Error(`Failed to connect to RabbitMQ: ${error}`);
    }
  }

  private async createConnection(
    url: string,
    options: ConnectionOptions
  ): Promise<Connection> {
    let attempts = 0;
    let lastError;

    while (attempts < (options.retry?.maxAttempts || 1)) {
      try {
        return await amqp.connect(url, { timeout: options.timeout });
      } catch (error) {
        attempts++;
        lastError = error;

        if (attempts >= (options.retry?.maxAttempts || 1)) {
          break;
        }

        const delay =
          (options.retry?.initialDelay || 1000) * Math.pow(2, attempts - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private handleConnectionError(error: any): void {
    console.error("RabbitMQ connection error:", error);
  }

  private handleConnectionClosed(): void {
    console.log("RabbitMQ connection closed");
    this.connection = null;
    this.channel = null;
    this.connectionPromise = null;
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.connectionPromise = null;
    }
  }

  private async getChannel(): Promise<Channel> {
    if (!this.connection) {
      throw new Error("Not connected to RabbitMQ. Call connect() first.");
    }

    if (!this.channel) {
      this.channel = await this.connection.createChannel();
      this.channel.on("error", (err) => {
        console.error("Channel error:", err);
        this.channel = null;
      });

      this.channel.on("close", () => {
        console.log("Channel closed");
        this.channel = null;
      });

      await this.channel.prefetch(10);
    }

    return this.channel;
  }

  async createQueue(
    queueName: string,
    options?: QueueOptions
  ): Promise<amqp.Replies.AssertQueue> {
    const channel = await this.getChannel();
    const queueOptions: Options.AssertQueue = {
      durable: options?.durable !== undefined ? options.durable : true,
      exclusive: options?.exclusive || false,
      autoDelete: options?.autoDelete || false,
      arguments: options?.arguments || {},
    };

    return channel.assertQueue(queueName, queueOptions);
  }

  async createExchange(
    exchangeName: string,
    options?: ExchangeOptions
  ): Promise<amqp.Replies.AssertExchange> {
    const channel = await this.getChannel();
    const exchangeType = options?.type || "direct";
    const exchangeOptions: Options.AssertExchange = {
      durable: options?.durable !== undefined ? options.durable : true,
      autoDelete: options?.autoDelete || false,
      internal: options?.internal || false,
      arguments: options?.arguments || {},
    };

    return channel.assertExchange(exchangeName, exchangeType, exchangeOptions);
  }

  async bindQueueToExchange(
    queueName: string,
    exchangeName: string,
    routingKey: string = ""
  ): Promise<amqp.Replies.Empty> {
    const channel = await this.getChannel();
    return channel.bindQueue(queueName, exchangeName, routingKey);
  }

  async publishMessage(
    exchangeName: string,
    routingKey: string = "",
    message: any,
    options?: PublishOptions
  ): Promise<boolean> {
    const channel = await this.getChannel();

    let content: Buffer;
    if (Buffer.isBuffer(message)) {
      content = message;
    } else if (typeof message === "string") {
      content = Buffer.from(message);
    } else {
      content = Buffer.from(JSON.stringify(message));
    }

    const publishOptions: Options.Publish = {
      contentType: options?.contentType || "application/json",
      contentEncoding: options?.contentEncoding,
      persistent: options?.persistent !== undefined ? options.persistent : true,
      expiration: options?.expiration,
      headers: options?.headers,
    };

    return channel.publish(exchangeName, routingKey, content, publishOptions);
  }

  async sendToQueue(
    queueName: string,
    message: any,
    options?: PublishOptions
  ): Promise<boolean> {
    const channel = await this.getChannel();

    let content: Buffer;
    if (Buffer.isBuffer(message)) {
      content = message;
    } else if (typeof message === "string") {
      content = Buffer.from(message);
    } else {
      content = Buffer.from(JSON.stringify(message));
    }

    const publishOptions: Options.Publish = {
      contentType: options?.contentType || "application/json",
      contentEncoding: options?.contentEncoding,
      persistent: options?.persistent !== undefined ? options.persistent : true,
      expiration: options?.expiration,
      headers: options?.headers,
    };

    return channel.sendToQueue(queueName, content, publishOptions);
  }

  async consumeQueue(
    queueName: string,
    callback: (
      message: any,
      originalMessage: ConsumeMessage
    ) => Promise<void> | void
  ): Promise<amqp.Replies.Consume> {
    const channel = await this.getChannel();

    return channel.consume(queueName, async (msg) => {
      if (msg === null) {
        console.warn("Consumer cancelled by server");
        return;
      }

      try {
        const contentType = msg.properties.contentType;
        let content: any;

        if (contentType === "application/json") {
          content = JSON.parse(msg.content.toString());
        } else {
          content = msg.content;
        }

        await Promise.resolve(callback(content, msg));
        channel.ack(msg);
      } catch (error) {
        console.error("Error processing message:", error);
        channel.nack(msg, false, true);
      }
    });
  }

  async request(
    exchangeName: string,
    routingKey: string,
    message: any,
    options?: { timeout?: number }
  ): Promise<any> {
    const channel = await this.getChannel();
    const correlationId = Math.random().toString() + Math.random().toString();

    const { queue: replyQueue } = await channel.assertQueue("", {
      exclusive: true,
    });

    const responsePromise = new Promise<any>((resolve, reject) => {
      const timeout = options?.timeout || 30000;
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);

      const cleanup = () => {
        channel.cancel(consumerTag);
        clearTimeout(timeoutId);
      };

      let consumerTag: string;

      channel
        .consume(
          replyQueue,
          (msg) => {
            if (msg?.properties.correlationId === correlationId) {
              cleanup();
              try {
                const content = JSON.parse(msg.content.toString());
                resolve(content);
              } catch (error) {
                reject(error);
              }
            }
          },
          { noAck: true }
        )
        .then((result) => {
          consumerTag = result.consumerTag;
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });

    const content = Buffer.from(JSON.stringify(message));
    channel.publish(exchangeName, routingKey, content, {
      contentType: "application/json",
      correlationId,
      replyTo: replyQueue,
    });

    return responsePromise;
  }
}
