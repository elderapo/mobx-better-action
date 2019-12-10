import { waitImmediate } from "@elderapo/utils";
import * as mobx from "mobx";

const startBatch = (mobx as any).startBatch;
const endBatch = (mobx as any).endBatch;

export const betterAction = (target: any, key: any, descriptor: any) => {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    let syncMode = true;

    const wrapped = new Proxy(this, {
      set: (target: any, key: any, value: any) => {
        // console.log(`Update from action(mode: ${mode})`);

        if (syncMode) {
          mobx.runInAction(() => {
            target[key] = value;
          });

          return true;
        }

        startBatch();

        mobx.runInAction(() => {
          target[key] = value;
        });

        setImmediate(() => endBatch());

        return true;
      }
    });

    startBatch();
    const ret = originalMethod.apply(wrapped, args);
    endBatch();

    syncMode = false;

    if (ret instanceof Promise) {
      return new Promise<any>(async (resolve, reject) => {
        try {
          const awaitedResult = await ret;

          // wait for async updates to flush
          await waitImmediate();
          return resolve(awaitedResult);
        } catch (ex) {
          await waitImmediate();
          return reject(ex);
        }
      });
    }

    return ret;
  };

  return descriptor;
};
