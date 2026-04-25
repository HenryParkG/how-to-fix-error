window.onPostDataLoaded({
    "title": "Resolving Airflow Worker Starvation in Dynamic DAGs",
    "slug": "airflow-worker-starvation-dynamic-dag",
    "language": "Python",
    "code": "ResourceExhaustion",
    "tags": [
        "Python",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>High-cardinality dynamic DAG generation (e.g., creating thousands of tasks from a database query within a DAG file) causes the Airflow Scheduler to spend excessive time parsing files. Because the Scheduler and Workers often share heartbeat mechanisms, a 'starvation' occurs where the Scheduler is too busy executing Python code in the DAG folder to heartbeat the tasks, causing them to be marked as 'zombies' or preventing new tasks from being queued.</p>",
    "root_cause": "Heavy computational logic or blocking I/O (like DB calls) inside the global scope of a DAG file. The Scheduler parses these files every `min_file_process_interval` seconds, leading to a CPU-bound bottleneck.",
    "bad_code": "# Inside dags/dynamic_dag.py\nclients = db.query(\"SELECT id FROM clients\") # Blocking I/O\nfor client in clients:\n    @dag(dag_id=f\"process_{client}\")\n    def my_dag():\n        PythonOperator(task_id=\"task\", python_callable=work)",
    "solution_desc": "Move the metadata acquisition outside the DAG parsing loop. Use a localized JSON/YAML cache file updated by a separate process, or use Airflow Variables/Datasets. Additionally, tune 'min_file_process_interval' and 'parsing_processes' in airflow.cfg to decouple parsing frequency from scheduling latency.",
    "good_code": "# Use a local cache updated by an external cron/trigger\nwith open('/tmp/client_cache.json') as f:\n    client_ids = json.load(f)\n\nfor c_id in client_ids:\n    @dag(dag_id=f\"process_{c_id}\")\n    def generated_dag():\n        # ...",
    "verification": "Check the Airflow UI 'Dag Processing Stats'. If 'Duration' exceeds 30 seconds consistently, starvation is imminent. Verify fix by monitoring 'scheduler_heartbeat' latency.",
    "date": "2026-04-25",
    "id": 1777100663,
    "type": "error"
});