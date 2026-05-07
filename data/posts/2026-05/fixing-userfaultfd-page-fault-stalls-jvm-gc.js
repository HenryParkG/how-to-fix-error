window.onPostDataLoaded({
    "title": "Fixing Userfaultfd Page Fault Stalls in JVM GC",
    "slug": "fixing-userfaultfd-page-fault-stalls-jvm-gc",
    "language": "Java",
    "code": "Kernel Page Fault Stall",
    "tags": [
        "Java",
        "Linux",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Modern low-pause JVM Garbage Collectors like ZGC and Shenandoah rely on <code>userfaultfd</code> (UFFD) to handle concurrent heap relocation. When a Java thread accesses an object that hasn't been moved yet, the kernel triggers a page fault that is handled in user-space by the GC threads. However, under high allocation pressure, these GC threads often stall. Our analysis shows that the bottleneck isn't the heap itself, but contention on the Linux <code>mmap_lock</code> (formerly <code>mmap_sem</code>) and the limited throughput of the UFFD descriptor when multiple faulting threads hammer a single handler.</p>",
    "root_cause": "The kernel's mmap_lock is held in write mode during certain memory operations, blocking UFFD fault handling. Additionally, a single-threaded UFFD event loop cannot process UFFDIO_COPY ioctls fast enough to keep up with hundreds of mutator threads.",
    "bad_code": "static void* uffd_handler(void* arg) {\n  struct uffd_msg msg;\n  for (;;) {\n    read(uffd, &msg, sizeof(msg));\n    if (msg.event == UFFD_EVENT_PAGEFAULT) {\n      struct uffdio_copy copy = { .dst = msg.arg.pagefault.address, .src = source_page, .len = 4096 };\n      ioctl(uffd, UFFDIO_COPY, &copy);\n    }\n  }\n}",
    "solution_desc": "Implement a multi-threaded UFFD handler architecture using epoll to distribute fault events across multiple worker threads. Additionally, tune the kernel parameters to use 'unprivileged_userfaultfd' and ensure the JVM uses transparent huge pages (THP) correctly to reduce the total number of page faults.",
    "good_code": "void start_parallel_handlers(int uffd) {\n  int epoll_fd = epoll_create1(0);\n  struct epoll_event ev = { .events = EPOLLIN, .data.fd = uffd };\n  epoll_ctl(epoll_fd, EPOLL_CTL_ADD, uffd, &ev);\n  // Launch multiple threads to read from epoll_fd\n  for (int i = 0; i < n_cpus; i++) {\n    pthread_create(&workers[i], NULL, parallel_uffd_worker, (void*)(intptr_t)epoll_fd);\n  }\n}",
    "verification": "Monitor /proc/self/status for high voluntary_ctxt_switches and use 'perf-kvm' to identify mmap_lock contention durations during GC cycles.",
    "date": "2026-05-07",
    "id": 1778141810,
    "type": "error"
});