window.onPostDataLoaded({
    "title": "Diagnosing Haskell Space Leaks in Lazy ByteStrings",
    "slug": "haskell-lazy-bytestring-space-leaks",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Node.js",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation is a powerful tool, but it often leads to memory overhead known as space leaks. In processing pipelines using <code>Data.ByteString.Lazy</code>, a leak typically occurs when a function holds onto the 'head' of a large ByteString while trying to process the 'tail'.</p><p>Because the runtime must keep the entire prefix of the string in memory until all references to it are cleared, a simple filter or fold can balloon into gigabytes of resident set size (RSS) if the thunks (unevaluated expressions) are not consumed correctly or if a reference to the original stream is accidentally captured in a closure.</p>",
    "root_cause": "The garbage collector cannot reclaim chunks of a lazy ByteString because a reference to an earlier part of the stream remains in scope, preventing the stream from being consumed in constant space.",
    "bad_code": "import qualified Data.ByteString.Lazy as L\n\nprocessData :: FilePath -> IO ()\nprocessData path = do\n    contents <- L.readFile path\n    -- Space Leak: 'contents' is kept in memory to calculate both length and first byte\n    print (L.length contents, L.head contents)",
    "solution_desc": "Refactor the pipeline to ensure single-pass consumption. Avoid binding the entire stream to a variable that is reused. Use strict folds or streaming libraries like 'conduit' or 'pipes' to force chunk processing and immediate reclamation.",
    "good_code": "import qualified Data.ByteString.Lazy as L\nimport Data.List (foldl')\n\n-- Fixed: Use a strict fold to process in one pass without holding the head\nprocessDataFixed :: FilePath -> IO ()\nprocessDataFixed path = do\n    contents <- L.readFile path\n    let result = L.foldlChunks (\\(len, _) chunk -> (len + fromIntegral (L.length (L.fromStrict chunk)), Just (L.head (L.fromStrict chunk)))) (0, Nothing) contents\n    print result",
    "verification": "Compile with '-with-rtsopts=-s' and monitor the 'maximum residency' in the generated GC stats to ensure it stays constant regardless of file size.",
    "date": "2026-03-06",
    "id": 1772771271,
    "type": "error"
});