window.onPostDataLoaded({
    "title": "Rust: Resolving Send-Bound Violations in Recursive Async",
    "slug": "rust-async-recursive-send-fix",
    "language": "Rust",
    "code": "Future: !Send",
    "tags": [
        "Rust",
        "Backend",
        "Tokio",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, recursive async functions present a unique challenge to the compiler's type system. Because async functions generate an anonymous state machine (a Future), a recursive call without indirection results in a type with infinite size. When using multi-threaded executors like Tokio, these futures must also satisfy the <code>Send</code> trait. However, the compiler often fails to prove that the state captured across await points is thread-safe in a recursive context, leading to frustrating <code>Future is not Send</code> errors.</p>",
    "root_cause": "Recursive async functions create a self-referential type cycle. Without explicit boxing, the compiler cannot calculate the size or verify the Send-safety of the state machine across recursion depths.",
    "bad_code": "async fn recursive_fetch(id: u32) -> String {\n    let val = fetch_from_db(id).await;\n    if id > 0 {\n        // Error: recursive call has no indirection\n        recursive_fetch(id - 1).await \n    } else {\n        val\n    }\n}",
    "solution_desc": "Use the `BoxFuture` type from the `futures` crate to introduce indirection. This moves the state machine to the heap and allows the compiler to verify the Send bound through an explicit `Box::pin` call.",
    "good_code": "use futures::future::{BoxFuture, FutureExt};\n\nfn recursive_fetch(id: u32) -> BoxFuture<'static, String> {\n    async move {\n        let val = fetch_from_db(id).await;\n        if id > 0 {\n            recursive_fetch(id - 1).await\n        } else {\n            val\n        }\n    }.boxed()\n}",
    "verification": "Compile using `cargo check`. If the function is passed to `tokio::spawn`, ensure no errors regarding the `Send` trait bound appear.",
    "date": "2026-04-28",
    "id": 1777373737,
    "type": "error"
});