window.onPostDataLoaded({
    "title": "Debugging Airflow DAG Idempotency Failures",
    "slug": "airflow-dag-idempotency-data-inconsistency",
    "language": "Python",
    "code": "IdempotencyError",
    "tags": [
        "Python",
        "SQL",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Airflow DAGs must be strictly idempotent: running the same DAG run with the same execution date multiple times should produce identical side effects without duplicate records or corrupted data. Developers often compromise idempotency by relying on dynamic runtime state (like SQL scripts using <code>NOW()</code>) or appending data without verifying if the target partition or keys already exist for that logical execution date.</p>",
    "root_cause": "The task appends records directly into the database using non-deterministic timestamping methods rather than utilizing Airflow's logical execution date templates, resulting in duplications upon retries.",
    "bad_code": "from airflow import DAG\nfrom airflow.providers.postgres.operators.postgres import PostgresOperator\nfrom datetime import datetime\n\nwith DAG('non_idempotent_dag', start_date=datetime(2023, 1, 1), schedule_interval='@daily') as dag:\n    # BUG: Running this task twice will duplicate records for the daily run\n    # BUG: uses NOW() which is not deterministic for the historical execution date\n    load_data = PostgresOperator(\n        task_id='load_daily_metrics',\n        postgres_conn_id='my_db',\n        sql=\"\"\"\n            INSERT INTO daily_metrics (metric_date, metric_value)\n            SELECT NOW(), COUNT(*)\n            FROM staging_events;\n        \"\"\"\n    )",
    "solution_desc": "Architect task behaviors to clean target tables before insertion (atomic delete-and-insert), or use transactional UPSERT statements. Rely exclusively on Airflow macros and context parameters like `{{ ds }}` to ensure execution dates align precisely with the targeted processing interval.",
    "good_code": "from airflow import DAG\nfrom airflow.providers.postgres.operators.postgres import PostgresOperator\nfrom datetime import datetime\n\nwith DAG('idempotent_dag', start_date=datetime(2023, 1, 1), schedule_interval='@daily') as dag:\n    # FIXED: Uses Airflow's Jinja template context for execution date '{{ ds }}'\n    # FIXED: Deletes stale records for the target execution date prior to inserting\n    load_data = PostgresOperator(\n        task_id='load_daily_metrics',\n        postgres_conn_id='my_db',\n        sql=\"\"\"\n            BEGIN;\n            DELETE FROM daily_metrics WHERE metric_date = '{{ ds }}'::DATE;\n            INSERT INTO daily_metrics (metric_date, metric_value)\n            SELECT '{{ ds }}'::DATE, COUNT(*)\n            FROM staging_events\n            WHERE event_date = '{{ ds }}'::DATE;\n            COMMIT;\n        \"\"\"\n    )",
    "verification": "Run the task inside Airflow CLI using `airflow tasks test idempotent_dag load_daily_metrics 2023-01-01`. Validate the data state. Re-run the task for the exact same date and confirm that zero new duplicate rows are added and the row values are correct.",
    "date": "2026-07-03",
    "id": 1783044091,
    "type": "error"
});