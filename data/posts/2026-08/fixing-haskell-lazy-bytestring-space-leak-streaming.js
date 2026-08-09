window.onPostDataLoaded({
    "title": "Fixing Haskell Lazy ByteString Space Leaks",
    "slug": "fixing-haskell-lazy-bytestring-space-leak-streaming",
    "language": "Haskell",
    "code": "Heap Space Leak",
    "tags": [
        "Haskell",
        "Space Leak",
        "Rust",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's non-strict evaluation model can introduce severe space leaks when holding onto unevaluated thunks in long-running streaming pipelines. When using lazy ByteStrings combined with non-strict fold operations across high-volume stream frames, un-evaluated heap expressions accumulate continuously, eventually causing Out Of Memory (OOM) fatal crashes.</p>",
    "root_cause": "Using non-strict fold operators (like foldl) over lazy ByteString streams creates an unbounded chain of unevaluated thunks in the heap. The garbage collector cannot reclaim intermediate stream chunks because the accumulator holds reference to the lazy sequence head.",
    "bad_code": "import qualified Data.ByteString.Lazy as BL\nimport Data.Word (Word8)\n\n-- Lazy fold keeps thunks in heap over large files\nprocessStream :: FilePath -> IO Word8\nprocessStream path = do\n    contents <- BL.readFile path\n    -- foldl retains head pointer and builds unevaluated sum thunks\n    return $ BL.foldl (\\acc byte -> acc + byte) 0 contents",
    "solution_desc": "Replace lazy folds with strict left folds (foldl') and employ strict accumulator evaluation patterns (BangPatterns) to evaluate intermediate byte calculations immediately at chunk boundaries, ensuring continuous O(1) memory GC collection.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport qualified Data.ByteString.Lazy as BL\nimport Data.Word (Word8)\n\n-- Strict foldl' forces immediate thunk evaluation\nprocessStreamStrict :: FilePath -> IO Word8\nprocessStreamStrict path = do\n    contents <- BL.readFile path\n    -- foldl' evaluates the accumulator strictly at each byte step\n    return $ BL.foldl' (\\ !acc !byte -> acc + byte) 0 contents",
    "verification": "Profile runtime heap memory using GHC RTS flags (+RTS -hy -p) while streaming multi-gigabyte payloads; verify flat allocation lines confirming constant O(1) memory footprint.",
    "date": "2026-08-09",
    "id": 1786257537,
    "type": "error"
});