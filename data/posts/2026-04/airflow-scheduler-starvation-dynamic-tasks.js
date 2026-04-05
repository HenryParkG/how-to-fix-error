window.onPostDataLoaded({
    "title": "Resolving Airflow Scheduler Starvation in Dynamic DAGs",
    "slug": "airflow-scheduler-starvation-dynamic-tasks",
    "language": "Python",
    "code": "SCHEDULER_LAG",
    "tags": [
        "Python",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When using dynamic task generation in Airflow (e.g., generating 1000+ tasks based on a database query within the DAG file), the scheduler spends excessive time parsing the DAG file. This blocks the scheduler's heartbeat and prevents other DAGs from being scheduled, leading to 'starvation' where the system appears idle but tasks never transition to the queued state.</p>",
    "root_cause": "Heavy computational logic or I/O operations inside the DAG parsing loop which blocks the Airflow Scheduler's dag_processing_manager.",
    "bad_code": "with DAG('starvation_dag', ...) as dag:\n    # BAD: External API call during parsing\n    config = requests.get('http://api/tasks').json()\n    for item in config:\n        PythonOperator(task_id=f'task_{item}', python_callable=work)",
    "solution_desc": "Implement Dynamic Task Mapping (AIP-42) using the .expand() method. This moves task generation from the parsing phase to the execution phase, keeping the scheduler responsive.",
    "good_code": "@task\ndef get_config():\n    return ['a', 'b', 'c', 'd'] # Simplified\n\n@task\ndef process(item):\n    print(f'Processing {item}')\n\nwith DAG('efficient_dag', ...) as dag:\n    items = get_config()\n    # GOOD: Tasks are expanded at runtime, not parse-time\n    process.expand(item=items)",
    "verification": "Check the Airflow UI 'Landing Times' and 'Gantt' charts to ensure 'Task Triage' latency is under 1 second.",
    "date": "2026-04-05",
    "id": 1775365595,
    "type": "error"
});