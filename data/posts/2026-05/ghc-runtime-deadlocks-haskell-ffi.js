window.onPostDataLoaded({
    "title": "Resolving GHC Runtime Deadlocks in Haskell FFI",
    "slug": "ghc-runtime-deadlocks-haskell-ffi",
    "language": "Haskell / C",
    "code": "RuntimeDeadlock",
    "tags": [
        "Rust",
        "Haskell",
        "FFI",
        "GHC",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's GHC runtime environment manages thousands of user-space green threads using a set of OS execution threads called Capabilities (typically mapped using <code>+RTS -N</code>). When a Haskell green thread invokes an external C library function using a non-interruptible foreign function call (like <code>unsafe</code> or standard synchronous FFI calls), GHC blocks the entire Capability thread until the C function returns. If the external C code invokes a blocking network pool, triggers a signal, or tries to call back into the Haskell runtime system via a stable pointer, it can exhaust all available Capabilities, causing a complete freeze of the RTS scheduler.</p>",
    "root_cause": "The root cause is using `foreign import ccall unsafe` or synchronous `safe` imports for long-running, blocking operations. This locks the GHC Capability thread. If the Haskell runtime needs to garbage collect or coordinate threads, it enters an irreversible deadlock because one or more Capabilities cannot reach a safe garbage-collection point.",
    "bad_code": "{-# LANGUAGE ForeignFunctionInterface #-}\nmodule BlockingFFI where\n\nimport Foreign.C.Types\n\n-- BUG: Unsafe FFI block blocks the entire GHC capability thread\n-- If c_wait_for_event blocks indefinitely, the RTS capability cannot yield.\nforeign import ccall unsafe \"wait_for_event\" \n  c_wait_for_event :: CInt -> IO CInt\n\nrunListener :: CInt -> IO ()\nrunListener fd = do\n  res <- c_wait_for_event fd\n  print res",
    "solution_desc": "To resolve this, declare the foreign call as `safe` (which schedules the call on a separate OS thread, freeing up the GHC Capability) or `interruptible`. This allows the GHC runtime to send signals to interrupt the blocking call if thread cancellation or GC coordination is required. Always design callbacks going from C back into Haskell using `Foreign.Ptr.FunPtr` combined with thread-safe queue dispatch patterns.",
    "good_code": "{-# LANGUAGE ForeignFunctionInterface #-}\nmodule SafeFFI where\n\nimport Foreign.C.Types\nimport Control.Concurrent\n\n-- FIX: Mark the FFI call as 'safe' and 'interruptible'\n-- This ensures GHC allocates an OS-level worker thread and preserves scheduling.\nforeign import ccall safe \"wait_for_event\" \n  c_wait_for_event :: CInt -> IO CInt\n\nrunListenerSafe :: CInt -> IO ()\nrunListenerSafe fd = do\n  -- Executed inside a green thread; safe blocks will not starve other green threads\n  resultMVar <- newEmptyMVar\n  _ <- forkIO $ do\n    res <- c_wait_for_event fd\n    putMVar resultMVar res\n  \n  val <- takeMVar resultMVar\n  print val",
    "verification": "Compile your Haskell binary with `-threaded` and execute using `+RTS -N2 -s`. Run a concurrency test generating high synthetic I/O loads alongside the FFI calls. Verify that other Haskell threads continue context-switching successfully and that the garbage collector statistics indicate zero thread-starvation halts.",
    "date": "2026-05-21",
    "id": 1779365292,
    "type": "error"
});