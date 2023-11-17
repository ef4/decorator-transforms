import * as runtime from "./runtime.ts";
for (let [key, value] of Object.entries(runtime)) {
  (globalThis as any)[key] = value;
}
