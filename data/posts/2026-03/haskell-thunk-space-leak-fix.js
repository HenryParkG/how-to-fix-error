window.onPostDataLoaded({
    "title": "Eliminating Thunk-Induced Space Leaks in Haskell",
    "slug": "haskell-thunk-space-leak-fix",
    "language": "Haskell",
    "code": "MEM_LEAK",
    "tags": [
        "Backend",
        "Go",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation can create 'thunks'\u2014unevaluated expressions stored in memory. When a recursive function or fold builds a massive chain of these thunks instead of calculating the result immediately, memory usage grows linearly with the number of iterations, leading to Out Of Memory (OOM) errors.</p>",
    "root_cause": "Lazy evaluation of accumulator variables in long-running recursive folds (e.g., using foldl instead of foldl').",
    "bad_code": "calculateSum :: [Int] -> Int\ncalculateSum list = foldl (+) 0 list -- Creates a massive thunk: (((0+1)+2)+3...)",
    "solution_desc": "Force strict evaluation of the accumulator using the bang pattern (!) or by switching to strict versions of library functions (like foldl') to evaluate values at each step.",
    "good_code": "import Data.List (foldl')\n\ncalculateSum :: [Int] -> Int\ncalculateSum list = foldl' (+) 0 list -- Evaluates immediately at each step",
    "verification": "Run the program with GHC runtime statistics (+RTS -s) and verify that memory residency remains constant regardless of input list size.",
    "date": "2026-03-22",
    "id": 1774161586,
    "type": "error"
});