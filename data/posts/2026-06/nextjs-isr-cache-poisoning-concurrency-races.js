window.onPostDataLoaded({
    "title": "Debugging Next.js ISR Cache Poisoning under High-Concurrency",
    "slug": "nextjs-isr-cache-poisoning-concurrency-races",
    "language": "TypeScript",
    "code": "ISR Cache Poisoning",
    "tags": [
        "Next.js",
        "TypeScript",
        "React",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Incremental Static Regeneration (ISR) allows Next.js to update static pages in the background after compilation has completed. When a request hits a stale page, Next.js serves the stale content and triggers a background revalidation. However, under high-concurrency scenarios, race conditions can corrupt or 'poison' this cache if downstream API fetches fail, timeout, or return incomplete structures.</p><p>If multiple incoming requests trigger concurrent background generations, and the backend data service experiences a transient failure, an unchecked `getStaticProps` function might catch the error and return partial data, fallback states, or a broken payload structure. Next.js saves this degraded response to its persistent edge cache, replacing healthy static pages with corrupted configurations. Subsequent visitors receive the broken payload until the revalidation timer expires again.</p>",
    "root_cause": "The Next.js ISR handler lacks validation checks and fails to propagate errors upstream. Instead of rejecting bad backend payloads and preserving the valid stale cache, it saves the corrupted state as the new static master payload.",
    "bad_code": "import { GetStaticProps } from 'next';\n\nexport const getStaticProps: GetStaticProps = async () => {\n  try {\n    const res = await fetch('https://api.external-service.com/v1/products');\n    const products = await res.json();\n    \n    // BUG: If downstream returns empty array on error, the page is cached as empty\n    return {\n      props: { products },\n      revalidate: 10,\n    };\n  } catch (err) {\n    // BUG: Returning static fallback on error poisons the cache with empty values\n    return {\n      props: { products: [] },\n      revalidate: 10,\n    };\n  }\n};",
    "solution_desc": "Enforce strict schema validation on the downstream API response using a validator like Zod. If the API response fails validation, response code checks, or network timeout expectations, explicit errors must be thrown. When `getStaticProps` throws an error, Next.js automatically aborts cache regeneration and continues serving the old, healthy stale cache, preventing cache poisoning.",
    "good_code": "import { GetStaticProps } from 'next';\nimport { z } from 'zod';\n\nconst ProductSchema = z.array(z.object({\n  id: z.string(),\n  name: z.string(),\n  price: z.number(),\n}));\n\nexport const getStaticProps: GetStaticProps = async () => {\n  try {\n    const res = await fetch('https://api.external-service.com/v1/products', {\n      headers: { 'Accept': 'application/json' },\n      signal: AbortSignal.timeout(5000), // Enforce strict timeout limits\n    });\n\n    if (!res.ok) {\n      throw new Error(`Upstream returned unhealthy status: ${res.status}`);\n    }\n\n    const rawData = await res.json();\n    // Verify structural validity of data payload before applying to cache\n    const products = ProductSchema.parse(rawData);\n\n    return {\n      props: { products },\n      revalidate: 60,\n    };\n  } catch (err) {\n    console.error(\"ISR Cache Revalidation Failed. Maintaining stale cache. Error:\", err);\n    \n    // Throwing forces Next.js to ignore this cycle and serve the existing cache\n    throw new Error(\"Abort cache generation: backend unhealthy\");\n  }\n};",
    "verification": "Simulate high concurrency with a tool like `k6` while intentionally shutting down the target downstream database. Verify that Next.js returns `HTTP 200` with the old static data payload, rather than serving or caching empty arrays.",
    "date": "2026-06-06",
    "id": 1780711943,
    "type": "error"
});