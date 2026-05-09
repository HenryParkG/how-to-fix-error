window.onPostDataLoaded({
    "title": "Resolving Haskell Lazy Space Leaks in Stream Pipelines",
    "slug": "haskell-lazy-evaluation-space-leak",
    "language": "Go",
    "code": "HeapStackOverflow",
    "tags": [
        "Go",
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation can lead to 'thunks' (unevaluated expressions) building up in memory during stateful stream processing. In long-running pipelines using libraries like Conduit or Pipes, using a non-strict left fold or a State monad without strictness annotations causes the heap to grow linearly with the number of processed elements, eventually leading to OOM.</p>",
    "root_cause": "Accumulating a chain of thunks in the state of a stream transformer instead of evaluating values to Weak Head Normal Form (WHNF).",
    "bad_code": "import Control.Monad.State\n\nprocessStream :: [Int] -> State Int ()\nprocessStream = mapM_ (\\x -> modify (+ x)) \n-- 'modify' is lazy, builds a massive (+1(+1(+1...))) thunk",
    "solution_desc": "Use strict versions of state modifiers (e.g., 'modify'') and ensure record fields are marked with bang patterns (!) to force evaluation.",
    "good_code": "import Control.Monad.State.Strict\n\ndata AppState = AppState { !count :: !Int }\n\nprocessStreamStrict :: [Int] -> State AppState ()\nprocessStreamStrict = mapM_ (\\x -> modify' (\\s -> s { count = count s + x }))",
    "verification": "Run the executable with '+RTS -hy' to generate a heap profile and ensure memory usage remains constant (O(1)).",
    "date": "2026-05-09",
    "id": 1778305226,
    "type": "error"
});