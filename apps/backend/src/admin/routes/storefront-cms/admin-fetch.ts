/** Fetch JSON từ Admin API (session cookie). Giống pattern các route admin custom. */
export const adminFetch = async (path: string, init?: RequestInit) => {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json &&
      "message" in json &&
      typeof (json as { message: string }).message === "string"
        ? (json as { message: string }).message
        : res.statusText
    throw new Error(msg)
  }
  return json
}
