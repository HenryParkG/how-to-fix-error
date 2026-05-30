window.onPostDataLoaded({
    "title": "Fix Rust Async Pinning & Self-Referential Streams",
    "slug": "fix-rust-async-pinning-self-referential-streams",
    "language": "Rust",
    "code": "lifetime error / Pin violation",
    "tags": [
        "Rust",
        "Async",
        "Tokio",
        "Error Fix"
    ],
    "analysis": "<p>Implementing custom asynchronous `Stream` structures in Rust often yields complex compiler errors when the stream must hold reference to its own fields across suspension points. Because asynchronous tasks can be moved in memory, the Rust compiler enforces strict pinning guarantees (`Pin<P>`) to ensure self-referential pointers are never invalidated. When trying to manually poll a child future or an underlying stream, developers frequently run into issues where the nested fields do not implement `Unpin`, causing compilation to fail during structural pinning.</p><p>To fix this, we must use pinning projection. This technique safely maps a pinned wrapper of a parent struct to pinned references of its fields without resorting to unsafe, undefined-behavior-prone raw pointer manipulation.</p>",
    "root_cause": "The compiler cannot verify that fields inside a self-referential struct remain at stable memory addresses when the outer struct is moved, unless those fields are structurally pinned and accessed via safe Pin projection projections.",
    "bad_code": "use std::pin::Pin;\nuse std::task::{Context, Poll};\nuse futures::stream::Stream;\n\nstruct UnsafeStream {\n    shared_buffer: Vec<u8>,\n    // This future references shared_buffer internally, causing borrowing conflicts\n    active_reader: Option<Pin<Box<dyn Stream<Item = Vec<u8>>>>>,\n}\n\nimpl Stream for UnsafeStream {\n    type Item = Vec<u8>;\n\n    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        // Error: cannot borrow field as mutable through Pin wrapper without projection\n        if let Some(ref mut reader) = self.active_reader {\n            return reader.as_mut().poll_next(cx);\n        }\n        Poll::Pending\n    }\n}",
    "solution_desc": "Utilize the `pin-project-lite` crate to safely declare projection methods on the struct. This allows you to project `Pin<&mut UnsafeStream>` into pinned references to its inner fields, permitting safe access to the underlying futures/streams while respecting borrowing and pinning invariants.",
    "good_code": "use std::pin::Pin;\nuse std::task::{Context, Poll};\nuse futures::stream::Stream;\nuse pin_project_lite::pin_project;\n\npin_project! {\n    #[must_use]\n    pub struct SafeStream<S> {\n        #[pin]\n        active_reader: S,\n        shared_buffer: Vec<u8>,\n    }\n}\n\nimpl<S> SafeStream<S> {\n    pub fn new(reader: S) -> Self {\n        Self {\n            active_reader: reader,\n            shared_buffer: Vec::new(),\n        }\n    }\n}\n\nimpl<S> Stream for SafeStream<S>\nwhere\n    S: Stream<Item = Vec<u8>>,\n{\n    type Item = Vec<u8>;\n\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        // Safely project the Pin wrapper onto individual fields\n        let this = self.project();\n        \n        // Accessing the pinned stream and polling it\n        match this.active_reader.poll_next(cx) {\n            Poll::Ready(Some(data)) => {\n                // Safely manipulate non-pinned fields concurrently\n                this.shared_buffer.extend_from_slice(&data);\n                Poll::Ready(Some(data))\n            }\n            Poll::Ready(None) => Poll::Ready(None),\n            Poll::Pending => Poll::Pending,\n        }\n    }\n}",
    "verification": "Run `cargo build` to confirm compilation success. Write an asynchronous test executing `tokio::pin!` on your stream and verify it compiles without life-cycle or safety boundary assertions using standard `tokio::test`.",
    "date": "2026-05-30",
    "id": 1780106964,
    "type": "error"
});