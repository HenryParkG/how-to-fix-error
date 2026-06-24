window.onPostDataLoaded({
    "title": "Fixing Rust Async Task Cancellation Hazards",
    "slug": "fixing-rust-async-cancellation-drop-safety",
    "language": "Rust",
    "code": "AsyncCancellationHazard",
    "tags": [
        "Rust",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, asynchronous tasks are driven by cooperative polling of Futures. A profound hazard arises because any Future can be dropped at an arbitrary yield point (an <code>.await</code> statement) if its parent task is cancelled, for instance, via a <code>tokio::select!</code> branch or timeout. If a Future is dropped mid-execution, its stack-allocated variables are dropped immediately, and any incomplete state transition can violate logical or memory safety invariants.</p><p>This is known as the Drop Safety Hazard. It is particularly dangerous when interfacing with raw pointers in unsafe blocks, handling transactional state in-memory, or managing external system resources. Unlike synchronous code where recovery blocks or defer statements are guaranteed to run, asynchronous cancellation abruptly ceases execution of the future's instruction stream, meaning code following the pending <code>.await</code> will never execute.</p>",
    "root_cause": "Rust futures are lazy and cooperative; cancellation is implemented by dropping the Future itself. If state changes must occur atomically across an await boundary, or if a resource relies on sequential post-await cleanup code instead of RAII (Resource Acquisition Is Initialization) Drop implementations, cancellation leaves the program in an inconsistent or partially written state.",
    "bad_code": "use tokio::time::{sleep, Duration};\n\nstruct TransactionManager {\n    is_locked: bool,\n}\n\nimpl TransactionManager {\n    async fn process_transaction(&mut self) {\n        self.is_locked = true;\n        // Hazard: If this future is cancelled during the sleep await point,\n        // self.is_locked remains true forever, causing a dead lock state.\n        sleep(Duration::from_millis(100)).await;\n        self.is_locked = false;\n    }\n}",
    "solution_desc": "To ensure drop safety and resilient task cancellation, transition-critical state operations must be bound to the RAII guard pattern by implementing the `Drop` trait on a dedicated guard struct. When the guard is dropped (either via normal execution or sudden async cancellation), the compiler guarantees its `drop` method runs, restoring system invariants. Alternatively, decouple critical tasks from cancellable execution branches by spawning them onto independent tasks using `tokio::spawn` which prevents parent cancellation from propagating.",
    "good_code": "use tokio::time::{sleep, Duration};\n\nstruct TransactionManager {\n    is_locked: bool,\n}\n\n// RAII Guard to guarantee state cleanup on drop, even during async cancellation\nstruct LockGuard<'a> {\n    manager: &'a mut TransactionManager,\n}\n\nimpl<'a> Drop for LockGuard<'a> {\n    fn drop(&mut self) {\n        self.manager.is_locked = false;\n    }\n}\n\nimpl TransactionManager {\n    async fn process_transaction(&mut self) {\n        self.is_locked = true;\n        let _guard = LockGuard { manager: self };\n        \n        // Safe: If cancelled during sleep, _guard's drop() is still guaranteed to run.\n        sleep(Duration::from_millis(100)).await;\n    }\n}",
    "verification": "Verify drop safety by writing unit tests wrapping the async execution in a `tokio::time::timeout` block. Assert that even when the timeout triggers and cancels the target future midway through its yield points, the cleanup logic (e.g., lock release, counter decrement, or buffer deallocation) is successfully executed as verified by standard assertions.",
    "date": "2026-06-24",
    "id": 1782268171,
    "type": "error"
});