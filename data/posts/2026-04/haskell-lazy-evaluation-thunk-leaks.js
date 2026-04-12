window.onPostDataLoaded({
    "title": "Mitigating Haskell Lazy Evaluation Thunk Leaks",
    "slug": "haskell-lazy-evaluation-thunk-leaks",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Rust",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation is powerful but can lead to 'space leaks' where the heap fills up with unevaluated expressions called 'thunks'. Instead of storing the result of a calculation, Haskell stores the recipe to calculate it.</p><p>If a large data structure is transformed multiple times without being forced to a Value, the chain of thunks can consume significantly more memory than the actual resulting data, leading to OOM (Out Of Memory) errors.</p>",
    "root_cause": "Accumulating recursive calls or folding over large lists using 'foldl' instead of the strict version 'foldl'', which prevents the intermediate results from being evaluated immediately.",
    "bad_code": "-- This builds a massive thunk chain in memory\nlet result = foldl (+) 0 [1..10000000]\nprint result",
    "solution_desc": "Use strict evaluation patterns. Replace 'foldl' with 'foldl'' from Data.List, and use Bang Patterns (!variable) to force the evaluation of critical accumulators to Weak Head Normal Form (WHNF).",
    "good_code": "import Data.List (foldl')\n\n-- foldl' forces the evaluation of the accumulator at each step\nlet result = foldl' (+) 0 [1..10000000]\nprint result\n\n-- Using BangPatterns\nsumStrict :: Int -> [Int] -> Int\nsumStrict !acc [] = acc\nsumStrict !acc (x:xs) = sumStrict (acc + x) xs",
    "verification": "Run the program with GHC runtime statistics enabled (+RTS -s). Check for 'bytes maximum residency' to ensure memory usage remains constant regardless of input size.",
    "date": "2026-04-12",
    "id": 1775986725,
    "type": "error"
});