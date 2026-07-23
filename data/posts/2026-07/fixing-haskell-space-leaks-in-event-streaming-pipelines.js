window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks in Event Streaming Pipelines",
    "slug": "fixing-haskell-space-leaks-in-event-streaming-pipelines",
    "language": "Haskell",
    "code": "Space Leak / Non-Strict Accumulator",
    "tags": [
        "Haskell",
        "Streaming",
        "Rust",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In real-time Haskell streaming pipelines (e.g., using Conduit, Streamly, or Pipes), lazy evaluation can quietly accumulate intermediate state as a massive graph of unevaluated function thunks rather than evaluated primitives. Under continuous event processing, these thunks build up in heap memory, changing what should be an O(1) space stream into an O(N) memory drain until the runtime crashes due to Out-Of-Memory (OOM) or degrades performance through GC churn.</p>",
    "root_cause": "Stateful stream aggregators that accumulate values lazily in Weak Head Normal Form (WHNF) default to deferring calculations, delaying evaluation until explicit demand is forced.",
    "bad_code": "-- Unevaluated thunk accumulation in recursive stream fold\nprocessStream :: Stream (Of Event) IO () -> IO Summary\nprocessStream stream = S.fold (\\acc evt -> acc { count = count acc + 1, totalBytes = totalBytes acc + eventSize evt }) (Summary 0 0) id stream",
    "solution_desc": "Force intermediate accumulator evaluations at each step using strict data type fields (`!`) along with strict stream folds like `S.fold'` to ensure immediate evaluation to Normal Form.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\n\ndata Summary = Summary {\n  count :: !Int,\n  totalBytes :: !Int\n}\n\nprocessStream :: Stream (Of Event) IO () -> IO Summary\nprocessStream stream = S.fold' (\\ !acc evt -> Summary (count acc + 1) (totalBytes acc + eventSize evt)) (Summary 0 0) id stream",
    "verification": "Profile runtime memory using `+RTS -hy -p` and verify using `hp2ps` that heap usage remains constant and flat regardless of event volume.",
    "date": "2026-07-23",
    "id": 1784771629,
    "type": "error"
});