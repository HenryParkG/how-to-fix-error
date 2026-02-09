window.onPostDataLoaded({
    "title": "Local Time in PG: The Consistency Killer",
    "slug": "postgresql-local-time-consistency-audit-trail",
    "language": "PostgreSQL",
    "code": "TimezoneAmbiguity",
    "tags": [
        "PostgreSQL",
        "Timezones",
        "Audit",
        "DistributedSystems",
        "UTC"
    ],
    "analysis": "<p>In modern, globally distributed application architecture, time synchronization is non-negotiable. Developers often default to using PostgreSQL's <code>TIMESTAMP WITHOUT TIME ZONE</code> datatype for convenience, believing that since their application server controls the context, the data remains consistent. This is a critical misconception.</p><p>When a microservice writes a value to a <code>TIMESTAMP WITHOUT TIME ZONE</code> column, PostgreSQL strictly stores the wall clock time (e.g., <code>2024-03-10 01:30:00</code>) without any reference to the offset or geographical location. This immediately renders the data ambiguous in any system that spans time zones or deals with historical data traversing Daylight Saving Time (DST) changes.</p><p>The nightmare begins when services interact. If Service A (running in EST) logs an event, and Service B (running in PST) later queries that event, Service B interprets that wall time according to its own configured timezone context. An audit trail or financial transaction log stored this way becomes fundamentally corrupted, as the sequence and actual temporal placement of events cannot be guaranteed without external, manual metadata tracking.</p><p>Furthermore, during DST transitions (e.g., Spring forward), the same wall clock time (like 1:30 AM) can occur twice in the same 24-hour period. <code>TIMESTAMP WITHOUT TIME ZONE</code> has no mechanism to distinguish between the 'first' 1:30 AM and the 'second' 1:30 AM, leading to non-determinism and catastrophic data interpretation failures in critical path logic.</p>",
    "root_cause": "The failure to store the necessary timezone offset metadata alongside the temporal value, leading to interpretation ambiguity by different clients or services operating in different zones, and lack of resolution during DST transitions.",
    "bad_code": "CREATE TABLE events (\n    event_id serial PRIMARY KEY,\n    action_name varchar(100) NOT NULL,\n    occurred_at timestamp without time zone -- DANGER: Local time storage\n);",
    "solution_desc": "The robust solution is to use <code>TIMESTAMP WITH TIME ZONE</code> (often abbreviated as <code>timestamptz</code>). Crucially, PostgreSQL does not store the timezone offset itself with this type. Instead, it converts the input time provided by the client's session timezone into a canonical value—UTC—and stores that UTC value internally. When retrieved, PostgreSQL converts the stored UTC value back to the querying client's session timezone. This guarantees that the stored data (the UTC epoch time) is consistent and unambiguous, regardless of where the writing service or the querying client is located.",
    "good_code": "CREATE TABLE events (\n    event_id serial PRIMARY KEY,\n    action_name varchar(100) NOT NULL,\n    occurred_at timestamp with time zone DEFAULT NOW() -- BEST PRACTICE: Stored internally as canonical UTC\n);",
    "verification": "Test the fix by setting your database session timezone to two different zones (e.g., <code>SET timezone TO 'America/Los_Angeles';</code> and <code>SET timezone TO 'Europe/London';</code>). Insert a new record in both sessions. Query the table without setting the session timezone. Verify that the <code>occurred_at</code> column shows the correct difference in hours, confirming that the canonical UTC time stored internally is identical for events that happened simultaneously across zones.",
    "date": "2026-02-09",
    "id": 1770609386
});