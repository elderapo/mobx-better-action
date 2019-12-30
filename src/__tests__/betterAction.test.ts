import { sleep } from "@elderapo/utils";
import { autorun, configure, observable } from "mobx";
import { betterAction } from "../betterAction";

describe("betterAction", () => {
  configure({ enforceActions: "observed" });

  describe("sync", () => {
    it("should correctly increment", () => {
      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public increment(by: number): void {
          this.count += by;
        }
      }

      const store = new Store();
      autorun(() => onAutorun(store.count));

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      store.increment(3);
      expect(store.count).toBe(3);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3);

      store.increment(6);
      expect(store.count).toBe(9);
      expect(onAutorun).toHaveBeenNthCalledWith(3, 9);
    });

    it("should batch updates", () => {
      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public increment(by: number): void {
          for (let i = 0; i < by; i++) {
            this.count++;
          }
        }
      }

      const store = new Store();
      autorun(() => onAutorun(store.count));

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      store.increment(3);
      expect(store.count).toBe(3);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3);

      store.increment(6);
      expect(store.count).toBe(9);
      expect(onAutorun).toHaveBeenNthCalledWith(3, 9);
    });

    it("should work with spawned async tasks", async () => {
      expect.assertions(10);

      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public delayedIncrementTwice(by: number): void {
          for (let i = 0; i < by; i++) {
            this.count++;
          }

          setTimeout(() => {
            this.count += by;
          }, 10);
        }
      }

      const store = new Store();
      autorun(() => onAutorun(store.count));

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      store.delayedIncrementTwice(3);
      expect(store.count).toBe(3);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3);

      await sleep(100);
      expect(store.count).toBe(6);
      expect(onAutorun).toHaveBeenNthCalledWith(3, 6);

      store.delayedIncrementTwice(6);
      expect(store.count).toBe(12);
      expect(onAutorun).toHaveBeenNthCalledWith(4, 12);

      await sleep(100);
      expect(store.count).toBe(18);
      expect(onAutorun).toHaveBeenNthCalledWith(5, 18);
    });
  });

  describe("async", () => {
    it("should immediately increment", async () => {
      expect.assertions(7);

      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public async increment(by: number): Promise<void> {
          this.count += by;
        }
      }

      const store = new Store();
      autorun(() => onAutorun(store.count));

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      store.increment(3);
      expect(store.count).toBe(3);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3);

      store.increment(6);
      expect(store.count).toBe(9);
      expect(onAutorun).toHaveBeenNthCalledWith(3, 9);

      expect(onAutorun).toHaveBeenCalledTimes(3);
    });

    it("should increment after async task", async () => {
      expect.assertions(7);

      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public async increment(by: number): Promise<void> {
          await sleep(1);
          this.count += by;
        }
      }

      const store = new Store();

      autorun(() => {
        onAutorun(store.count);
      });

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      await store.increment(3);
      expect(store.count).toBe(3);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3);

      await store.increment(6);
      expect(store.count).toBe(9);
      expect(onAutorun).toHaveBeenNthCalledWith(3, 9);

      expect(onAutorun).toHaveBeenCalledTimes(3);
    });

    it("should batch updates in sync blocks", async () => {
      expect.assertions(9);

      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public async batchIncrementTwice(by: number): Promise<void> {
          for (let i = 0; i < by; i++) {
            this.count++;
          }

          await sleep(1);

          for (let i = 0; i < by; i++) {
            this.count++;
          }
        }
      }

      const store = new Store();

      autorun(() => {
        onAutorun(store.count);
      });

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      await store.batchIncrementTwice(3);
      expect(store.count).toBe(6);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3);
      expect(onAutorun).toHaveBeenNthCalledWith(3, 6);

      await store.batchIncrementTwice(6);
      expect(store.count).toBe(18);
      expect(onAutorun).toHaveBeenNthCalledWith(4, 12);
      expect(onAutorun).toHaveBeenNthCalledWith(5, 18);

      expect(onAutorun).toHaveBeenCalledTimes(5);
    });

    it("should work with spawned async tasks", async () => {
      expect.assertions(11);

      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public async delayedIncrementTwice(by: number): Promise<void> {
          await sleep(1);
          this.count += by;

          setTimeout(() => {
            this.count += by;
          }, 10);
        }
      }

      const store = new Store();

      autorun(() => {
        onAutorun(store.count);
      });

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      await store.delayedIncrementTwice(3);
      expect(store.count).toBe(3);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3);

      await sleep(50);
      expect(store.count).toBe(6);
      expect(onAutorun).toHaveBeenNthCalledWith(3, 6);

      await store.delayedIncrementTwice(6);
      expect(store.count).toBe(12);
      expect(onAutorun).toHaveBeenNthCalledWith(4, 12);

      await sleep(50);
      expect(store.count).toBe(18);
      expect(onAutorun).toHaveBeenNthCalledWith(5, 18);

      expect(onAutorun).toHaveBeenCalledTimes(5);
    });

    it("should work with multiple async actions mutating same state", async () => {
      expect.assertions(11);

      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public async batchIncrementTwice(
          by: number,
          waitMS: number
        ): Promise<void> {
          for (let i = 0; i < by; i++) {
            this.count++;
          }

          await sleep(waitMS);

          for (let i = 0; i < by; i++) {
            this.count++;
          }
        }
      }

      const store = new Store();

      autorun(() => {
        onAutorun(store.count);
      });

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      await Promise.all([
        store.batchIncrementTwice(3, 10),
        store.batchIncrementTwice(6, 25),
        store.batchIncrementTwice(5, 50)
      ]);

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3); /// 3
      expect(onAutorun).toHaveBeenNthCalledWith(3, 9); /// 3, 6
      expect(onAutorun).toHaveBeenNthCalledWith(4, 14); // 3, 6, 5
      expect(onAutorun).toHaveBeenNthCalledWith(5, 17); // 3, 6, 5, 3
      expect(onAutorun).toHaveBeenNthCalledWith(6, 23); // 3, 6, 5, 3, 6
      expect(onAutorun).toHaveBeenNthCalledWith(7, 28); // 3, 6, 5, 3, 6, 5

      expect(store.count).toBe(28);

      expect(onAutorun).toHaveBeenCalledTimes(7);
    });

    it("should work with multiple async actions mutating same state (batched batches lol...)", async () => {
      // expect.assertions(11);

      const onAutorun = jest.fn<void, [number]>();

      class Store {
        @observable
        public count: number = 0;

        @betterAction
        public async batchIncrementTwice(
          by: number,
          waitMS: number
        ): Promise<void> {
          for (let i = 0; i < by; i++) {
            this.count++;
          }

          await sleep(waitMS);

          for (let i = 0; i < by; i++) {
            this.count++;
          }
        }
      }

      const store = new Store();

      autorun(() => {
        onAutorun(store.count);
      });

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(store.count).toBe(0);

      await Promise.all([
        store.batchIncrementTwice(3, 10),
        store.batchIncrementTwice(6, 10),
        store.batchIncrementTwice(5, 10)
      ]);

      expect(onAutorun).toHaveBeenNthCalledWith(1, 0);
      expect(onAutorun).toHaveBeenNthCalledWith(2, 3); /// 3
      expect(onAutorun).toHaveBeenNthCalledWith(3, 9); /// 3, 6
      expect(onAutorun).toHaveBeenNthCalledWith(4, 14); // 3, 6, 5
      expect(onAutorun).toHaveBeenNthCalledWith(5, 28); // 3, 6, 5, 3, 6, 5

      expect(store.count).toBe(28);

      expect(onAutorun).toHaveBeenCalledTimes(5);
    });
  });
});
