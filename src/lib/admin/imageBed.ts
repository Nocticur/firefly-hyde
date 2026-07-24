function getEnv(key: string, env?: Record<string, unknown>): string {
	const value = env?.[key] ?? process.env[key];
	return typeof value === "string" ? value : "";
}

export async function imageBedUpload(
	file: File,
	env?: Record<string, unknown>,
): Promise<{ url: string }> {
	const url = getEnv("IMG_BED_URL", env).replace(/\/+$/, "");
	const token = getEnv("IMG_BED_TOKEN", env);
	if (!url) throw new Error("IMG_BED_URL not configured");

	const formData = new FormData();
	formData.append("file", file);
	if (token) formData.append("token", token);

	const r = await fetch(url, { method: "POST", body: formData });
	if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
	const result = (await r.json()) as Array<{ src: string; publicUrl?: string }>;
	const imageUrl = result?.[0]?.publicUrl || result?.[0]?.src || "";
	if (!imageUrl) throw new Error("No image URL in response");
	return { url: imageUrl };
}

export async function imageBedDelete(
	key: string,
	env?: Record<string, unknown>,
): Promise<void> {
	const url = getEnv("IMG_BED_URL", env).replace(/\/+$/, "");
	const token = getEnv("IMG_BED_TOKEN", env);
	if (!url) throw new Error("IMG_BED_URL not configured");

	const deleteUrl = `${url}/${key}`;
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;

	const r = await fetch(deleteUrl, { method: "DELETE", headers });
	if (!r.ok) throw new Error(`Delete failed: ${r.status}`);
}
