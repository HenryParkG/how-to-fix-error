window.onPostDataLoaded({
    "title": "Fixing Next.js RSC Payload Bloat",
    "slug": "nextjs-rsc-payload-bloat",
    "language": "Next.js",
    "code": "PayloadSizeWarning",
    "tags": [
        "Next.js",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Server Components (RSC) serialize data to pass it from the server to the client. In deeply nested trees, developers often pass large database objects via props. Even if a child component only uses one property, the entire object is serialized into the __next_f JSON payload, leading to multi-megabyte HTML responses.</p>",
    "root_cause": "Serialization of unused fields in large data objects across the Server/Client boundary.",
    "bad_code": "async function ServerComponent() {\n  const user = await db.user.findUnique({ id: 1 });\n  return <ClientComponent user={user} />; // user contains hash, salt, logs\n}",
    "solution_desc": "Implement Data Transfer Objects (DTOs) or explicit picking of fields before passing data to Client Components. Use a dedicated 'shreader' function to sanitize props.",
    "good_code": "async function ServerComponent() {\n  const user = await db.user.findUnique({ id: 1 });\n  // Only pass what is needed\n  const clientUser = { name: user.name, avatar: user.avatar };\n  return <ClientComponent user={clientUser} />;\n}",
    "verification": "Check the Network tab in DevTools. Compare the size of the initial HTML and the RSC payload before and after the change.",
    "date": "2026-02-23",
    "id": 1771811399,
    "type": "error"
});