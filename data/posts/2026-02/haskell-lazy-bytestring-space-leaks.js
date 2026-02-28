window.onPostDataLoaded({
    "title": "Profiling Haskell Space Leaks in Lazy ByteString Pipelines",
    "slug": "haskell-lazy-bytestring-space-leaks",
    "language": "Haskell",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Performance",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Haskell applications, Lazy ByteStrings are often used to process data larger than RAM. However, if the pipeline contains thunks that are not strictly evaluated, the runtime maintains a chain of references to the original data, leading to a space leak. This usually manifests as a gradual increase in Resident Set Size (RSS) despite the garbage collector running frequently.</p>",
    "root_cause": "The accumulation of unevaluated thunks in the heap that hold references to the entire input stream, preventing the Garbage Collector from reclaiming processed chunks.",
    "bad_code": "import qualified Data.ByteString.Lazy as BL\n\nprocessData :: FilePath -> IO Int\nprocessData path = do\n    contents <- BL.readFile path\n    -- This creates a space leak because 'length' doesn't force the elements\n    -- and the spine remains in memory if used later.\n    return (fromIntegral $ BL.length contents)",
    "solution_desc": "Use strict evaluation patterns or 'foldl'' to ensure that each chunk is processed and garbage collected immediately. Alternatively, switch to a streaming library like 'Conduit' or 'Pipes' for better resource management.",
    "good_code": "import qualified Data.ByteString.Lazy as BL\nimport Data.Foldable (foldl')\n\nprocessDataStrict :: FilePath -> IO Int\nprocessDataStrict path = do\n    contents <- BL.readFile path\n    -- foldl' forces evaluation of the accumulator, allowing GC to collect chunks\n    let len = BL.foldlChunks (\\acc chunk -> acc + BL.length (BL.fromStrict chunk)) 0 contents\n    return (fromIntegral len)",
    "verification": "Run the executable with '+RTS -s' to check memory allocation or use 'eventlog' with 'hp2ps' to visualize the heap profile.",
    "date": "2026-02-28",
    "id": 1772251958,
    "type": "error"
});