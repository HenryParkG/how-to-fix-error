window.onPostDataLoaded({
    "title": "Fixing Next.js App Router Server Action Edge Memory Leaks",
    "slug": "fixing-nextjs-app-router-server-action-memory-leaks",
    "language": "TypeScript",
    "code": "ERR_OUT_OF_MEMORY",
    "tags": [
        "Next.js",
        "TypeScript",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>Applications utilizing Next.js App Router with Server Actions executing in Edge or Node.js runtime workers frequently exhibit progressive memory leaks. When Server Actions are defined inline inside React Server Components (RSC) or reference external module-scoped state contexts, JS closures capture request context objects, database connections, or large data buffers. Because Edge isolates and server processes reuse execution contexts across invocations, these captured variables are never garbage collected, causing V8 heap usage to grow monotonically until worker crash (<code>ERR_OUT_OF_MEMORY</code>).</p>",
    "root_cause": "Inline Server Action functions retain lexical references to outer Server Component scope (props, headers, searchParams) and global scope objects. The Next.js bundling step binds these dynamic scopes into long-lived action handler references registered in server closure memory tables.",
    "bad_code": "// Buggy pattern: Inline Server Action inside a Server Component\nimport { db } from '@/lib/db';\n\nexport default async function UserProfilePage({ params }: { params: { id: string } }) {\n  const heavyContextData = await db.loadMassiveContext(params.id);\n\n  // DANGEROUS: Inline server action captures heavyContextData in closure\n  async function updateUserBio(formData: FormData) {\n    'use server';\n    const bio = formData.get('bio') as string;\n    // Captures outer heavyContextData reference indefinitely\n    await db.user.update({ \n      where: { id: params.id, meta: heavyContextData.metaId }, \n      data: { bio } \n    });\n  }\n\n  return (\n    <form action={updateUserBio}>\n      <input type=\"text\" name=\"bio\" />\n      <button type=\"submit\">Update Bio</button>\n    </form>\n  );\n}",
    "solution_desc": "Extract all Server Actions into dedicated standalone action files marked with the top-level `'use server'` directive. Ensure actions receive only minimal scalar primitives (IDs, strings) directly from client form invocations or `bind()` calls, preventing accidental capture of server-side component component render contexts.",
    "good_code": "// app/actions/user.ts\n'use server';\n\nimport { db } from '@/lib/db';\nimport { z } from 'zod';\n\nconst UpdateBioSchema = z.object({\n  userId: z.string(),\n  bio: z.string().max(500),\n});\n\n// Clean, top-level Server Action with zero contextual closure binding\nexport async function updateUserBio(userId: string, formData: FormData) {\n  const bio = formData.get('bio') as string;\n  const validated = UpdateBioSchema.parse({ userId, bio });\n\n  await db.user.update({\n    where: { id: validated.userId },\n    data: { bio: validated.bio },\n  });\n}\n\n// app/profile/[id]/page.tsx\nimport { updateUserBio } from '@/app/actions/user';\n\nexport default async function UserProfilePage({ params }: { params: { id: string } }) {\n  const updateBioWithId = updateUserBio.bind(null, params.id);\n\n  return (\n    <form action={updateBioWithId}>\n      <input type=\"text\" name=\"bio\" />\n      <button type=\"submit\">Update Bio</button>\n    </form>\n  );\n}",
    "verification": "Run `autocannon` or `k6` to send high-concurrency POST requests against the Server Action endpoint. Profile process memory using Node.js `--inspect` flag or V8 heap snapshots in Chrome DevTools. Memory consumption should stabilize after initial warm-up, demonstrating a saw-tooth GC pattern without linear drift.",
    "date": "2026-07-29",
    "id": 1785303797,
    "type": "error"
});