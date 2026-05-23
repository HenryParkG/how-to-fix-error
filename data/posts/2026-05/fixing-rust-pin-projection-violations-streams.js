window.onPostDataLoaded({
    "title": "Fixing Rust Pin-Projection Violations in Streams",
    "slug": "fixing-rust-pin-projection-violations-streams",
    "language": "Rust",
    "code": "PinProjectionViolation",
    "tags": [
        "Rust",
        "Async",
        "Streams",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, implementing custom asynchronous wrappers like the <code>Stream</code> or <code>Future</code> traits often forces you to manage nested pin states. A common vulnerability arises when attempting to access the fields of a pinned struct (pin-projection). If we violate the structural pinning rules\u2014either by moving structural data or exposing a mutable reference without guaranteeing its pinning invariants\u2014the compiler rejects the code with lifetime mismatches or lifetime-related borrow errors. In worse cases where unsafe code is used to bypass checks, this violation can result in memory corruption and undefined behavior.</p>",
    "root_cause": "Manual pin-projection that attempts to move or mutably reference structural fields without asserting Pin invariants, causing lifetime conflicts and violation of the Unpin/Pin contracts.",
    "bad_code": "use std::pin::Pin;\nuse std::task::{Context, Poll};\nuse futures::stream::Stream;\n\nstruct CustomStream<S> {\n    inner: S,\n}\n\nimpl<S: Stream + Unpin> Stream for CustomStream<S> {\n    type Item = S::Item;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        // BAD: Dereferencing Pin<&mut Self> illegally moves or accesses fields\n        // without pin-projection guarantees if S is structural.\n        let this = unsafe { self.get_unchecked_mut() };\n        Pin::new(&mut this.inner).poll_next(cx)\n    }\n}",
    "solution_desc": "Use the safe, declarative pin-project-lite crate to generate sound pin-projections automatically. This enforces correctness at compile time without manual unsafe blocks.",
    "good_code": "use std::pin::Pin;\nuse std::task::{Context, Poll};\nuse futures::stream::Stream;\nuse pin_project_lite::pin_project;\n\npin_project! {\n    struct CustomStream<S> {\n        #[pin]\n        inner: S,\n    }\n}\n\nimpl<S: Stream> Stream for CustomStream<S> {\n    type Item = S::Item;\n    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {\n        let this = self.project();\n        this.inner.poll_next(cx)\n    }\n}",
    "verification": "Run `cargo test` and run dynamic verification using `cargo miri test` to ensure no raw pointer invariants or pinning assumptions are broken.",
    "date": "2026-05-23",
    "id": 1779502050,
    "type": "error"
});