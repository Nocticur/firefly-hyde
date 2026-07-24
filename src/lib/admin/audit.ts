import { createAdminStore, type RuntimeBindings } from "./storage";

export async function writeAudit(
	actor: string,
	action: string,
	resource: string,
	status: string,
	requestId: string,
	bindings: RuntimeBindings = {},
): Promise<void> {
	await createAdminStore(bindings).writeAudit(
		actor,
		action,
		resource,
		status,
		requestId,
	);
}
