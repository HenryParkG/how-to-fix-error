window.onPostDataLoaded({
    "title": "Identifying Thunk Leaks in Long-Running State Monads",
    "slug": "haskell-state-monad-thunk-leak-fix",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Haskell",
        "Functional Programming",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, lazy evaluation is a double-edged sword. When using the State monad in a long-running computation, the state value might not be immediately evaluated. Instead, Haskell builds a chain of unevaluated function applications called 'thunks'. In a loop with thousands of iterations, these thunks consume heap space linearly, eventually leading to a Stack Overflow or an Out of Memory (OOM) error, even if the actual data structure should remain small.</p>",
    "root_cause": "The use of the lazy version of the State monad (Control.Monad.State) which doesn't force the evaluation of the state until it is explicitly demanded.",
    "bad_code": "import Control.Monad.State\n\nrecursiveTask :: Int -> State Int ()\nrecursiveTask 0 = return ()\nrecursiveTask n = do\n    modify (+1) -- Thunk builds up here\n    recursiveTask (n-1)",
    "solution_desc": "Switch to the strict version of the State monad. The strict version forces the evaluation of the state at every 'bind' operation, preventing the accumulation of unevaluated expressions.",
    "good_code": "import qualified Control.Monad.State.Strict as S\n\nrecursiveTask :: Int -> S.State Int ()\nrecursiveTask 0 = return ()\nrecursiveTask n = do\n    S.modify' (+1) -- The ' signifies strictness\n    recursiveTask (n-1)",
    "verification": "Compile with '-prof -fprof-auto' and run with '+RTS -hT'. Use 'hp2ps' to verify that the heap usage remains constant rather than growing linearly.",
    "date": "2026-03-24",
    "id": 1774314839,
    "type": "error"
});