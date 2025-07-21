export interface ServerTransport {
  start(): Promise<void>;
  stop(): Promise<void>;
}
