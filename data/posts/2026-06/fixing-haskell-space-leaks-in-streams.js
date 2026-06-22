window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks in Streams",
    "slug": "fixing-haskell-space-leaks-in-streams",
    "language": "Haskell",
    "code": "Memory Leak (OOM)",
    "tags": [
        "Go",
        "Rust",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>Haskell applications designed for high-throughput stream processing can suffer from severe, silent space leaks that eventually trigger Out-Of-Memory (OOM) crashes on production workers. Because Haskell evaluates expressions lazily by default, aggregate operations (such as computing running averages, sums, or keeping state across sliding windows) do not calculate values immediately. Instead, they construct nested chains of unevaluated computations (called thunks) on the heap. Over millions of stream packets, these thunks build up exponentially, consuming all available heap space.</p>",
    "root_cause": "Using non-strict accumulator functions (like 'foldl' instead of 'foldl'') or storing lazily evaluated fields inside state records causes Haskell to build a chain of pointers (thunks) in memory instead of computing values as they arrive.",
    "bad_code": "-- Buggy lazy folding over a stream of metrics\nmodule Metrics where\n\ndata MetricState = MetricState {\n    totalSum   :: !Double,\n    totalCount :: Int -- Oops: missing strictness annotation (!)\n}\n\nupdateState :: MetricState -> Double -> MetricState\nupdateState state val = \n    MetricState (totalSum state + val) (totalCount state + 1) \n    -- The addition is postponed, creating a massive thunk chain.",
    "solution_desc": "Convert all state records to use strict data fields with BangPatterns and switch to strict aggregators ('foldl''). By forcing evaluation at each step of the stream, Haskell discards temporary state immediately and stores only the resulting calculated primitive values on the heap.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule Metrics where\n\n-- All fields explicitly declared strict with '!'\ndata MetricState = MetricState {\n    totalSum   :: !Double,\n    totalCount :: !Int\n}\n\nupdateState :: MetricState -> Double -> MetricState\nupdateState !state !val = \n    let !newSum   = totalSum state + val\n        !newCount = totalCount state + 1\n    in MetricState newSum newCount\n-- Strictly forces evaluation at each step, preventing thunks.",
    "verification": "Compile the application with profiling enabled ('ghc -prof -fprof-auto -rtsopts'). Run the streaming executable with RTS options ('./app +RTS -hc -p'). Use 'hp2ps' to generate the memory profile graph and verify that the heap line is completely flat over sustained loads instead of growing linearly.",
    "date": "2026-06-22",
    "id": 1782096624,
    "type": "error"
});