window.onPostDataLoaded({
    "title": "Fixing OCaml 5.0 Multicore Memory Leaks in Effect Handlers",
    "slug": "ocaml-5-effect-handler-memory-leak-fix",
    "language": "OCaml",
    "code": "Leak: Fiber Stack",
    "tags": [
        "Backend",
        "Go",
        "Multicore",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.0 introduced multicore support via algebraic effects. A common pitfall is 'leaking' the continuation (fiber) within a custom effect handler. Because effect handlers capture the current execution context, failing to properly resume or explicitly discontinue a continuation prevents the Garbage Collector (GC) from reclaiming the associated stack space and closure-captured variables.</p>",
    "root_cause": "The handler captures a continuation but neither calls 'continue' nor 'discontinue', leaving the fiber in a suspended state that the GC cannot collect.",
    "bad_code": "type _ Effect.t += Log : string -> unit Effect.t\n\nlet handler = {\n  effc = fun (type a) (e : a Effect.t) ->\n    match e with\n    | Log msg -> Some (fun (k : (a, _) continuation) ->\n        print_endline msg;\n        (* Missing continue k () or discontinue k *)\n        ())\n    | _ -> None\n}",
    "solution_desc": "Always ensure every branch of the 'effc' function manages the continuation 'k' by either resuming execution or raising an exception via discontinue to unwind the stack.",
    "good_code": "let handler = {\n  effc = fun (type a) (e : a Effect.t) ->\n    match e with\n    | Log msg -> Some (fun (k : (a, _) continuation) ->\n        print_endline msg;\n        continue k ()) (* Correctly resumes execution *)\n    | _ -> None\n}",
    "verification": "Use 'memtrace' to analyze heap and stack allocations. A successful fix will show stable memory usage over long-running effect-heavy loops.",
    "date": "2026-04-06",
    "id": 1775459906,
    "type": "error"
});