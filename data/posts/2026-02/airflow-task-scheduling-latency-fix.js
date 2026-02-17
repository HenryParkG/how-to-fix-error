window.onPostDataLoaded({
    "title": "Solving Task Scheduling Latency in Large Airflow DAGs",
    "slug": "airflow-task-scheduling-latency-fix",
    "language": "Python",
    "code": "Latency/Perf",
    "tags": [
        "Python",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>As Airflow deployments scale to thousands of DAGs, the scheduler often experiences 'starvation' where tasks remain in a 'queued' or 'scheduled' state for minutes. This is typically caused by the Scheduler loop spending too much time parsing DAG files (DAG Processing) or being bottlenecked by the metadata database. When the processing time exceeds the heartbeat interval, the scheduler becomes unresponsive to new task instances.</p>",
    "root_cause": "Top-level code in DAG files (e.g., dynamic task generation via DB queries) causes the DagFileProcessor to hang, blocking the scheduling loop.",
    "bad_code": "# BAD: Database call at top-level\nlines = db.session.query(Table).all()\nwith DAG('my_dag') as dag:\n    for line in lines:\n        BashOperator(task_id=f'task_{line.id}', ...)",
    "solution_desc": "Optimize DAG parsing by removing top-level dynamic logic. Increase the number of parsing processes and tune the 'scheduler__min_file_process_interval'. Use Airflow Variables or environment variables instead of direct DB hits for dynamic generation.",
    "good_code": "# GOOD: Use a static source or cached config\nimport json\nwith open('dag_config.json') as f:\n    configs = json.load(f)\n\nwith DAG('my_dag') as dag:\n    for cfg in configs:\n        BashOperator(task_id=f'task_{cfg[\"id\"]}', ...)",
    "verification": "Monitor the 'dag_processing.total_parse_time' metric in StatsD. Latency is resolved when parse time is consistently below 30 seconds.",
    "date": "2026-02-17",
    "id": 1771291039,
    "type": "error"
});