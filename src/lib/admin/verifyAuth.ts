export async function verifyBasicAuth(c: any): Promise<boolean> {
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Basic ")) return false;

	const base64 = authHeader.slice(6);
	const decoded = atob(base64);
	const [username, password] = decoded.split(":");

	const adminUser = process.env.ADMIN_USERNAME;
	const adminPass = process.env.ADMIN_PASSWORD;

	if (!adminUser || !adminPass) return false;
	return username === adminUser && password === adminPass;
}
