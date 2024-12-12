import type { BatchOptions, Realtime } from "@allure/plugin-api";
import console from "node:console";
import type { EventEmitter } from "node:events";
import { setTimeout } from "node:timers/promises";

export interface AllureStoreEvents {
  testResult: [string];
  testFixtureResult: [string];
  attachmentFile: [string];
}

interface HandlerData {
  buffer: string[];
  timeout?: Promise<void>;
  ac?: AbortController;
}

export class Events implements Realtime {
  readonly #emitter: EventEmitter<AllureStoreEvents>;
  #handlers: HandlerData[] = [];

  constructor(emitter: EventEmitter<AllureStoreEvents>) {
    this.#emitter = emitter;
  }

  onTestResults = (listener: (trIds: string[]) => Promise<void>, options: BatchOptions = {}): void => {
    const { maxTimeout = 100 } = options;
    const handler = this.#createHandler(maxTimeout, listener);
    this.#emitter.on("testResult", handler);
  };

  onTestFixtureResults = (listener: (tfrIds: string[]) => Promise<void>, options: BatchOptions = {}): void => {
    const { maxTimeout = 100 } = options;
    const handler = this.#createHandler(maxTimeout, listener);
    this.#emitter.on("testFixtureResult", handler);
  };

  onAttachmentFiles(listener: (afIds: string[]) => Promise<void>, options: BatchOptions = {}): void {
    const { maxTimeout = 100 } = options;
    const handler = this.#createHandler(maxTimeout, listener);
    this.#emitter.on("attachmentFile", handler);
  }

  onAll(listener: () => Promise<void>, options: BatchOptions = {}): void {
    const { maxTimeout = 100 } = options;
    const handler = this.#createHandler(maxTimeout, listener);

    this.#emitter.on("testResult", handler);
    this.#emitter.on("testFixtureResult", handler);
    this.#emitter.on("attachmentFile", handler);
  }

  offAll(): void {
    this.#emitter.removeAllListeners();
    for (const handler of this.#handlers) {
      handler.ac?.abort();
    }
    this.#handlers = [];
  }

  #createHandler(maxTimeout: number, listener: (args: string[]) => Promise<void>) {
    const handler: HandlerData = {
      buffer: [],
    };
    this.#handlers.push(handler);

    return (trId: string) => {
      handler.buffer.push(trId);

      // release timeout is already set
      if (handler.timeout) {
        return;
      }

      handler.ac = new AbortController();
      handler.timeout = setTimeout<void>(maxTimeout, undefined, { signal: handler.ac.signal })
        .then(() => {
          handler.timeout = undefined;
          const bufferCopy = [...handler.buffer];
          handler.buffer = [];
          handler.ac = undefined;
          return listener(bufferCopy);
        })
        .catch((err) => {
          if (err.name === "AbortError") {
            return;
          }
          console.error("can't execute listener", err);
        });
    };
  }
}
