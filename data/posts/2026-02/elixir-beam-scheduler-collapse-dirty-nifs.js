window.onPostDataLoaded({
    "title": "Fixing BEAM Scheduler Collapse with Dirty NIFs",
    "slug": "elixir-beam-scheduler-collapse-dirty-nifs",
    "language": "Elixir",
    "code": "SchedulerCollapse",
    "tags": [
        "Elixir",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang BEAM VM, schedulers are designed for non-blocking, asynchronous operations. When a Native Implemented Function (NIF) performs heavy CPU-bound computation, it hijacks the scheduler thread. Since BEAM expects NIFs to return within 1 millisecond, a long-running NIF causes 'scheduler collapse,' where other processes assigned to that scheduler starve, leading to system-wide latency spikes and heartbeat failures in distributed clusters.</p>",
    "root_cause": "Executing CPU-intensive C code synchronously on a standard BEAM scheduler, preventing the VM from performing process switching and garbage collection.",
    "bad_code": "static ERL_NIF_TERM heavy_compute(ErlNifEnv* env, int argc, const ERL_NIF_TERM argv[]) {\n    // This blocks the scheduler thread for 500ms\n    long_running_task();\n    return enif_make_int(env, 1);\n}\n\nstatic ErlNifFunc nif_funcs[] = {\n    {\"heavy_compute\", 1, heavy_compute}\n};",
    "solution_desc": "Architecturally, long-running NIFs must be flagged as 'Dirty'. This tells the BEAM to offload the execution to a separate pool of dirty CPU schedulers, preserving the responsiveness of the main scheduler threads.",
    "good_code": "static ERL_NIF_TERM heavy_compute(ErlNifEnv* env, int argc, const ERL_NIF_TERM argv[]) {\n    long_running_task();\n    return enif_make_int(env, 1);\n}\n\nstatic ErlNifFunc nif_funcs[] = {\n    // Use ERL_NIF_DIRTY_JOB_CPU_BOUND flag\n    {\"heavy_compute\", 1, heavy_compute, ERL_NIF_DIRTY_JOB_CPU_BOUND}\n};",
    "verification": "Use ':observer.start()' and monitor 'Load Charts'. Verify that scheduler utilization is distributed and that the dirty CPU scheduler pool is handling the NIF workload without impacting UI responsiveness or process reductions.",
    "date": "2026-02-22",
    "id": 1771735526,
    "type": "error"
});