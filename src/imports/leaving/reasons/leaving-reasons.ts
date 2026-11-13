import { Backup } from "./backup";
import { Died } from "./died";
import type { LeavingReason } from "./leaving-reason";
import { Retired } from "./retired";

export const LEAVING_REASONS: readonly LeavingReason[] = [new Died(), new Retired(), new Backup()];
