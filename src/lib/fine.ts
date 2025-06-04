import { FineClient } from "@fine-dev/fine-js";
import type { Schema } from "./db-types.ts";

export const fine = new FineClient<Schema>("https://platform.fine.dev/customer-feasible-vendor-matching-joint-latitude");