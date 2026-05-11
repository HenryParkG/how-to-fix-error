window.onPostDataLoaded({
    "title": "Fixing Haskell Lazy Stream Space Leaks",
    "slug": "haskell-lazy-stream-space-leak",
    "language": "Haskell",
    "code": "Heap Overflow",
    "tags": [
        "Haskell",
        "Backend",
        "Functional Programming",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's non-strict evaluation is powerful but can lead to space leaks where memory usage grows linearly with input size. This often happens in stream processing or folds where the runtime builds up a massive chain of deferred computations (thunks) instead of evaluating values immediately.</p><p>A space leak occurs when a thunk consumes more memory than the evaluated result would, and it persists in the heap until a final 'demand' forces its evaluation, often causing a crash on large datasets.</p>",
    "root_cause": "Using lazy accumulator functions like `foldl` or lazy record fields which allow thunks to accumulate in the heap instead of performing immediate reduction.",
    "bad_code": "import Data.List\n\n-- Lazy foldl builds a massive thunk: (((0 + 1) + 2) + ...)\nprocessStream :: [Int] -> Int\nprocessStream xs = foldl (+) 0 xs",
    "solution_desc": "Replace lazy folds with strict equivalents (`foldl'`) and use Bang Patterns (`!`) to force evaluation of accumulators. This ensures that the memory footprint remains constant (O(1)) relative to the stream size.",
    "good_code": "import Data.List (foldl')\n\n-- Strict foldl' evaluates the accumulator at each step\nprocessStream :: [Int] -> Int\nprocessStream xs = foldl' (+) 0 xs\n\n-- Alternatively, using Bang Patterns\nsumStrict !acc [] = acc\nsumStrict !acc (x:xs) = sumStrict (acc + x) xs",
    "verification": "Compile with `-prof -fprof-auto` and run with `+RTS -hc` to generate a heap profile. The graph should show constant memory usage rather than a 'sawtooth' or 'mountain' shape.",
    "date": "2026-05-11",
    "id": 1778465454,
    "type": "error"
});