window.onPostDataLoaded({
    "title": "Linux Kernel: Scheduler Starvation from RT Priorities",
    "slug": "linux-kernel-scheduler-starvation-realtime-cgroups",
    "language": "Linux Kernel",
    "code": "SchedulerStarvation",
    "tags": [
        "Linux",
        "Kernel",
        "Scheduler",
        "cgroups",
        "Real-time",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Scheduler starvation occurs when high-priority tasks monopolize CPU resources, preventing lower-priority tasks from ever getting CPU time. In the Linux kernel, this is particularly problematic with real-time (RT) scheduling policies like <code>SCHED_FIFO</code> and <code>SCHED_RR</code>. Unlike the default <code>SCHED_OTHER</code> (CFS, Completely Fair Scheduler), RT tasks are assigned fixed priorities (1-99) and will preempt any non-RT task. An RT task with a higher priority will even preempt other RT tasks. If an RT task spins indefinitely or performs long computations without yielding, it can effectively freeze all other processes on the same CPU core.</p><p>While RT priorities are crucial for latency-sensitive applications, their misapplication or lack of proper resource isolation can lead to system unresponsiveness. The problem is exacerbated in systems where real-time tasks are not confined by resource limits. A single rogue RT process can grind critical system services (e.g., network daemons, database processes, shell access) to a halt, making debugging difficult or impossible.</p>",
    "root_cause": "Uncontrolled real-time processes (<code>SCHED_FIFO</code>, <code>SCHED_RR</code>) consuming excessive CPU without adequate resource limits (e.g., via cgroups), leading to the starvation of all non-real-time tasks on affected CPU cores. This can happen due to buggy RT code or malicious processes.",
    "bad_code": "Executing a real-time process without cgroup limits:\n<pre><code># echo 99 > /proc/self/rt_priority\n# chrt -f 99 ./my_rt_process_loop</code></pre>\nThis command runs <code>my_rt_process_loop</code> with the highest real-time priority, potentially starving other processes if <code>my_rt_process_loop</code> is CPU-intensive and doesn't yield.",
    "solution_desc": "The primary solution involves configuring Linux cgroups (control groups) to impose CPU limits on real-time tasks. Specifically, the <code>cpu.rt_runtime_us</code> and <code>cpu.rt_period_us</code> parameters within the <code>cpu</code> cgroup can cap the amount of CPU time real-time tasks within that group can consume within a given period. For instance, setting `rt_runtime_us` to 950000 and `rt_period_us` to 1000000 (1 second) would limit real-time tasks to 95% of a CPU core. Additionally, general CPU usage can be limited with <code>cpu.shares</code>. For non-real-time tasks, consider using <code>SCHED_IDLE</code> or <code>SCHED_BATCH</code> for background work that should never starve other processes. Implement robust monitoring for high CPU usage by RT tasks.",
    "good_code": "Applying cgroup v1 limits for real-time tasks:\n<pre><code># Create a cgroup for RT tasks\n$ sudo mkdir /sys/fs/cgroup/cpu/realtime_tasks\n$ sudo sh -c \"echo 950000 > /sys/fs/cgroup/cpu/realtime_tasks/cpu.rt_runtime_us\"\n$ sudo sh -c \"echo 1000000 > /sys/fs/cgroup/cpu/realtime_tasks/cpu.rt_period_us\"\n\n# Move a real-time process into the cgroup\n$ sudo sh -c \"echo $(pidof my_rt_process_loop) > /sys/fs/cgroup/cpu/realtime_tasks/tasks\"\n</code></pre>\nThis limits the real-time process to 95% of one CPU core, preventing total starvation.",
    "verification": "Monitor system responsiveness and CPU utilization using tools like <code>htop</code>, <code>top</code>, and <code>pidstat -t</code>. Specifically, observe the CPU usage of the real-time process and ensure that other critical system processes (e.g., <code>sshd</code>, <code>systemd</code>) are still receiving CPU time. Use <code>trace-cmd</code> or <code>perf sched</code> to analyze scheduler behavior and identify potential starvation if issues persist. Verify cgroup limits are active by checking <code>/sys/fs/cgroup/cpu/realtime_tasks/cpu.rt_runtime_us</code> and <code>cpu.rt_period_us</code>.",
    "date": "2026-09-18",
    "id": 1789697689,
    "type": "error"
});