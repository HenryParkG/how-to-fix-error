window.onPostDataLoaded({
    "title": "Fixing XLA Graph Breakages in JAX Training",
    "slug": "fixing-xla-graph-breakages-jax",
    "language": "Python",
    "code": "XLA_COMPILATION_ERROR",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>JAX relies on the XLA (Accelerated Linear Algebra) compiler to fuse operations into efficient kernels. A 'graph breakage' occurs when Python control flow (like if-statements or loops) depends on the value of a traced array rather than its shape.</p><p>This forces JAX to leak into the Python interpreter during a JIT-compiled trace, leading to 'ConcretizationTypeError'. This is particularly common in distributed training where dynamic shapes or conditional logging are used inside the main training loop.</p>",
    "root_cause": "Using standard Python control flow on JAX Tracers without marking them as static or using JAX-specific functional control flow primitives.",
    "bad_code": "@jax.jit\ndef train_step(state, batch):\n    if state.step % 100 == 0: # Error: ConcretizationTypeError\n        print(state.loss)\n    return state",
    "solution_desc": "Use `jax.lax.cond` or `jax.lax.while_loop` for value-dependent logic, and use `static_argnums` in the JIT decorator for hyperparameter-based logic.",
    "good_code": "@partial(jax.jit, static_argnums=(2,))\ndef train_step(state, batch, debug):\n    def log_fn(s): return jax.debug.print(\"Loss: {}\", s.loss)\n    jax.lax.cond(state.step % 100 == 0, log_fn, lambda x: None, state)\n    return state",
    "verification": "Run code with 'JAX_LOG_COMPILES=1' to ensure the function compiles exactly once and doesn't re-trigger on every iteration.",
    "date": "2026-04-07",
    "id": 1775538282,
    "type": "error"
});