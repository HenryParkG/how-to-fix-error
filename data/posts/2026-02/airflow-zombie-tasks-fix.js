window.onPostDataLoaded({
    "title": "Fixing Airflow Zombie Tasks in Celery Executors",
    "slug": "airflow-zombie-tasks-fix",
    "language": "Python",
    "code": "ZombieTask",
    "tags": [
        "Python",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Zombie tasks in Apache Airflow occur when the Airflow database thinks a task is 'running', but the process on the Celery worker is no longer reporting heartbeats. This often happens in containerized environments where the worker process is killed by the OOM killer or network partitions prevent the worker from updating the metadata database. The scheduler eventually detects the lack of heartbeats and marks the task as failed, but not before wasting significant queue time.</p>",
    "root_cause": "Mismatch between Celery's visibility timeout and Airflow's scheduler heartbeat threshold, leading to tasks being orphaned without cleanup.",
    "bad_code": "[scheduler]\njob_heartbeat_threshold = 30\n\n# CELERY CONFIG (default visibility_timeout is too low)\nbroker_transport_options = {'visibility_timeout': 3600}",
    "solution_desc": "Increase the `visibility_timeout` for the Celery broker to exceed the longest expected task duration and synchronize the `scheduler_zombie_task_threshold` to allow for brief network spikes.",
    "good_code": "[scheduler]\nscheduler_zombie_task_threshold = 300\njob_heartbeat_threshold = 60\n\n# Celery Config in airflow.cfg\ncelery_config_options = {\n    'broker_transport_options': {'visibility_timeout': 21600} \n}",
    "verification": "Monitor the `airflow_scheduler_zombies` metric in Prometheus and verify that 'zombie' logs in the scheduler logs correlate with successful task state transitions.",
    "date": "2026-02-14",
    "id": 1771050876,
    "type": "error"
});