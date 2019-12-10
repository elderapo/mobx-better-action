import * as mobx from "mobx";
import { produce } from "immer";
import { waitImmediate, sleep } from "@elderapo/utils";

enum ActionMode {
  Unknown = "unknown",
  Async = "async",
  Sync = "sync"
}

export const betterAction = (target: any, key: any, descriptor: any) => {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    let mode = ActionMode.Unknown;

    let scheduledUpdates = mobx.toJS(this);

    const addScheduledUpdate = (key: any, value: any): void => {
      scheduledUpdates = produce(scheduledUpdates, (draft: any) => {
        draft[key] = value;
      });
    };

    const flushUpdates = () => {
      mobx.runInAction(() => {
        Object.assign(this, scheduledUpdates);
      });
    };

    const wrapped = new Proxy(this, {
      get: (_, key) => scheduledUpdates[key],
      set: (target: any, key: any, value: any) => {
        // console.log(`Update from action(mode: ${mode})`);

        if (mode === ActionMode.Sync || mode === ActionMode.Unknown) {
          addScheduledUpdate(key, value);

          return true;
        }

        if (mode === ActionMode.Async) {
          addScheduledUpdate(key, value);
          setImmediate(() => flushUpdates());

          return true;
        }

        throw new Error(`Unknown action mode(${mode})!`);
      }
    });

    const ret = originalMethod.apply(wrapped, args);

    mode = ret instanceof Promise ? ActionMode.Async : ActionMode.Sync;

    flushUpdates();

    mode = ActionMode.Async;

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
