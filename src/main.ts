import { sleep } from "@elderapo/utils";

export const main = async () => {
  console.log("Sleeping for 100ms...");
  await sleep(100);
  console.log("Done!");
};

if (require.main === module) {
  main();
}
