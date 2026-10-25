window.onPostDataLoaded({
    "title": "Fix Haskell Space Leaks in StateT Accumulators",
    "slug": "debug-haskell-space-leaks-statet-accumulators",
    "language": "Haskell",
    "code": "Heap Exhaustion (Space Leak)",
    "tags": [
        "Rust",
        "Haskell",
        "Backend",
        "Memory",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, monad transformers such as <code>Control.Monad.Trans.State.Strict</code> are frequently used to manage stateful computations. Despite importing the 'strict' variant of <code>StateT</code>, applications often suffer catastrophic space leaks when running long-lived or recursive stateful loops.</p><p>The issue stems from the subtle mechanics of Haskell evaluation. While <code>StateT.Strict</code> evaluates the tuple <code>(a, s)</code> to Weak Head Normal Form (WHNF) at each bind operation, it does <em>not</em> evaluate the fields inside the state value <code>s</code>. When updating a composite state\u2014such as a record containing counters, maps, or numeric accumulators\u2014using <code>modify</code>, unevaluated expression thunks accumulate in the heap. The heap consumption grows linearly with iteration count until Garbage Collection thrashing freezes the runtime or terminates the process with an Out of Memory error.</p>",
    "root_cause": "The strict `modify` function (`modify'`) forces the outer state constructor to WHNF (`seq`), but nested accumulator fields within the state record remain unevaluated thunks. Because evaluation is deferred, a growing chain of thunks is retained in memory throughout the lifetime of the monad loop.",
    "bad_code": "import Control.Monad.Trans.State.Strict\nimport Control.Monad.IO.Class (liftIO)\n\ndata Metrics = Metrics {\n    packetCount :: !Int,\n    byteTotal   :: !Integer\n}\n\n-- Bug: Although using StateT.Strict and modify', the tuple constructor\n-- is forced to WHNF, but arithmetic operations (+ count, + bytes)\n-- construct lazy thunks inside the fields if records aren't fully forced.\nprocessChunks :: [Int] -> StateT Metrics IO ()\nprocessChunks [] = pure ()\nprocessChunks (len:xs) = do\n    modify' (\\s -> s {\n        packetCount = packetCount s + 1,\n        byteTotal   = byteTotal s + fromIntegral len\n    })\n    processChunks xs",
    "solution_desc": "Apply deep pattern matching using `BangPatterns` directly on state fields during state modification, or combine record updates with strict evaluation combinators like `$!` or `Control.DeepSeq.deepseq`. When defining state data types, ensure all nested types have strict unpack annotations (`{-# UNPACK #-} !Int`) or use `Control.Monad.State.Strict` alongside explicit strict folds.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Control.Monad.Trans.State.Strict\nimport Control.DeepSeq (NFData, deepseq)\nimport GHC.Generics (Generic)\n\ndata Metrics = Metrics {\n    packetCount :: {-# UNPACK #-} !Int,\n    byteTotal   :: !Integer\n} deriving (Show, Generic)\n\ninstance NFData Metrics\n\n-- Fix: Force strict field evaluation using BangPatterns on intermediate\n-- accumulator variables before constructing the updated state record.\nprocessChunks :: [Int] -> StateT Metrics IO ()\nprocessChunks [] = pure ()\nprocessChunks (len:xs) = do\n    modify' (\\(Metrics !c !b) ->\n        let !nextCount = c + 1\n            !nextBytes = b + fromIntegral len\n        in Metrics nextCount nextBytes\n      )\n    processChunks xs",
    "verification": "Profile the executable using GHC profiling flags: `ghc -prof -fprof-auto -rtsopts App.hs`. Run with memory profiling enabled: `./App +RTS -hy -p` and view the generated heap profile with `hp2ps -c App.hp`. Confirm that the heap graph displays a constant horizontal line (O(1) memory) rather than a linear sawtooth or monotonic spike.",
    "date": "2026-10-25",
    "id": 1792915201,
    "type": "error"
});