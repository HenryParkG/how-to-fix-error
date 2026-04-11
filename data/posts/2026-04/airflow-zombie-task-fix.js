window.onPostDataLoaded({
    "title": "Resolving Airflow Scheduler Zombie Task Loops",
    "slug": "airflow-zombie-task-fix",
    "language": "Python",
    "code": "ZombieTask",
    "tags": [
        "Python",
        "Airflow",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In high-parallelism Airflow environments (especially using Celery or Kubernetes Executors), tasks can enter a 'Zombie' state. This occurs when a task process is running but the heartbeat fails to reach the DB, or the Scheduler loses the task's state due to database connection pooling exhaustion. The Scheduler eventually detects the task as a zombie, kills it, and restarts it, leading to infinite execution loops and resource wastage.</p>",
    "root_cause": "Race conditions between the LocalTaskJob heartbeat and the Scheduler's 'scheduler_zombie_task_threshold', often triggered by high DB latency or metadata DB lock contention.",
    "bad_code": "[scheduler]\nparallelism = 1000\ndag_dir_list_interval = 30\n# Default threshold is often too low for high-load DBs\nscheduler_zombie_task_threshold = 300",
    "solution_desc": "Increase the zombie task threshold to allow for network/DB jitter and optimize the heartbeat frequency. Additionally, ensure the metadata database (Postgres/MySQL) has sufficient connection pool depth to handle concurrent heartbeats from hundreds of workers.",
    "good_code": "# airflow.cfg adjustments\n[scheduler]\nscheduler_zombie_task_threshold = 600\njob_heartbeat_sec = 10\n\n[core]\n# Increase SQL Alchemy pool size\nsql_alchemy_pool_size = 32\nsql_alchemy_max_overflow = 64",
    "verification": "Check Airflow Scheduler logs for 'Detected zombie task' entries. Monitor the 'task_instance' table for repeating state transitions from 'running' to 'queued'.",
    "date": "2026-04-11",
    "id": 1775899946,
    "type": "error"
});