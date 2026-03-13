window.onPostDataLoaded({
    "title": "Resolving Rust PhantomData Variance in Lock-Free Logic",
    "slug": "rust-phantomdata-variance-lock-free",
    "language": "Rust",
    "code": "VarianceMismatch",
    "tags": [
        "Rust",
        "Backend",
        "HighPerformance",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, variance defines how subtyping of type arguments relates to subtyping of the generic types. When building lock-free data structures using raw pointers (like <code>*mut T</code>), the compiler loses information about the ownership and lifetime of <code>T</code>. By default, <code>PhantomData&lt;T&gt;</code> is covariant, meaning the compiler assumes that if <code>'a: 'b</code>, then <code>Struct&lt;'a&gt;</code> is a subtype of <code>Struct&lt;'b&gt;</code>. In concurrent contexts where data might be mutated or shared across threads via atomic pointers, covariance can lead to soundness issues where a reference is dropped while the lock-free structure still believes it holds a valid pointer.</p>",
    "root_cause": "The default covariance of PhantomData<T> allows the compiler to shrink lifetimes too aggressively, which is unsafe when the struct logically 'owns' a type that it accesses through raw pointers without standard borrow checking.",
    "bad_code": "use std::marker::PhantomData;\n\nstruct AtomicCell<T> {\n    ptr: *mut T,\n    _marker: PhantomData<T>, // Covariant: can lead to use-after-free in complex lifetimes\n}\n\nimpl<T> AtomicCell<T> {\n    fn new(val: T) -> Self {\n        let ptr = Box::into_raw(Box::new(val));\n        Self { ptr, _marker: PhantomData }\n    }\n}",
    "solution_desc": "To ensure soundness, we must change the variance of the marker. Using `PhantomData<fn(T) -> T>` makes the type invariant over `T`. This prevents the compiler from automatically converting a `AtomicCell<&'long T>` into a `AtomicCell<&'short T>`, which is critical when the structure performs interior mutability or cross-thread synchronization.",
    "good_code": "use std::marker::PhantomData;\nuse std::sync::atomic::{AtomicPtr, Ordering};\n\nstruct AtomicCell<T> {\n    ptr: AtomicPtr<T>,\n    // Use a function pointer signature to force Invariance\n    _marker: PhantomData<fn(T) -> T>,\n}\n\nimpl<T> AtomicCell<T> {\n    pub fn new(val: T) -> Self {\n        let ptr = Box::into_raw(Box::new(val));\n        Self {\n            ptr: AtomicPtr::new(ptr),\n            _marker: PhantomData,\n        }\n    }\n}",
    "verification": "Compile the code using `cargo check`. Use a lifetime-heavy test case to ensure that attempting to pass a shorter-lived reference to a long-lived AtomicCell container results in a compile-time error rather than a runtime crash.",
    "date": "2026-03-13",
    "id": 1773384033,
    "type": "error"
});