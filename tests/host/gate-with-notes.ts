import type { Gate } from "../../src/fence/gate/gatekeeper";
import type { HostNotes } from "../../src/host/host";

export type GateWithNotes = Gate & { readonly notes: HostNotes };
