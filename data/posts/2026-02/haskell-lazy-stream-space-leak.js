window.onPostDataLoaded({
    "title": "Fixing Space Leaks in Lazy Stream Graphs",
    "slug": "haskell-lazy-stream-space-leak",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Go",
        "Backend",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation is powerful for processing infinite streams, but it often leads to space leaks when a reference to the 'head' of a stream is retained while the 'tail' is consumed. This prevents the Garbage Collector (GC) from reclaiming memory of processed elements because the original pointer still views the entire graph as potentially needed. In complex stream graphs, this manifests as a slow, linear increase in heap usage until an OOM (Out Of Memory) occurs.</p>",
    "root_cause": "Holding a reference to an unevaluated thunk (lazy value) in a scope that outlives the consumption of that stream, specifically during nested folds or shared stream references.",
    "bad_code": "processStream :: [Int] -> (Int, Int)\nprocessStream xs = (sum xs, length xs)\n-- Problem: sum consumes xs but xs is kept alive to calculate length",
    "solution_desc": "Use strict data structures or fold the stream into a single pass using a strict pair (Tup2) or BangPatterns. This ensures that as elements are consumed, they are immediately reduced to values and their memory is freed.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Data.List (foldl')\n\nprocessStream :: [Int] -> (Int, Int)\nprocessStream = foldl' (\\(!s, !l) x -> (s + x, l + 1)) (0, 0)\n-- Strict fold ensures stream is consumed and discarded in one pass",
    "verification": "Run the binary with RTS options '+RTS -hc' to generate a heap profile and ensure the 'active' memory curve is flat.",
    "date": "2026-02-15",
    "id": 1771147411,
    "type": "error"
});