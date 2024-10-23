import * as runtime from './runtime.ts';
import { globalId } from './global-id.ts';
(globalThis as any)[globalId] = runtime;
