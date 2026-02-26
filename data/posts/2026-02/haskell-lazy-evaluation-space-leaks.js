window.onPostDataLoaded({
    "title": "Eliminating Haskell Space Leaks in Thunk Chains",
    "slug": "haskell-lazy-evaluation-space-leaks",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Backend",
        "Haskell",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation is powerful but can lead to 'space leaks' when large chains of unevaluated computations (thunks) build up in memory. Instead of storing the result of a calculation, Haskell stores the instruction to calculate it.</p><p>In recursive functions or folds, these thunks can accumulate until the heap is exhausted, even if the final result is a small integer. This is common in long-running loops that don't force evaluation of intermediate states.</p>",
    "root_cause": "The use of lazy folds (like foldl) creates a massive nested thunk structure in the heap that is only evaluated at the very end of the computation.",
    "bad_code": "sumList :: [Int] -> Int\nsumList = foldl (+) 0 -- Build a thunk (0+1+2+3...) that grows with list size",
    "solution_desc": "Switch to strict evaluation using 'foldl'' (the strict version of foldl) or use BangPatterns to force the evaluation of the accumulator at each step.",
    "good_code": "import Data.List (foldl')\n\n-- foldl' forces evaluation of the accumulator at each step\nsumListStrict :: [Int] -> Int\nsumListStrict = foldl' (+) 0",
    "verification": "Run the program with GHC runtime statistics (+RTS -s). Observe the 'peak_megabytes_total' to ensure it remains constant regardless of input size.",
    "date": "2026-02-26",
    "id": 1772098808,
    "type": "error"
});