window.onPostDataLoaded({
    "title": "Mitigating Akka Actor Mailbox Overflow",
    "slug": "akka-actor-mailbox-overflow-leak",
    "language": "Java",
    "code": "MailboxOverflowException",
    "tags": [
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Akka actors use mailboxes to buffer incoming messages. During network partitions, if an actor uses the 'Stash' trait to defer messages until a resource is available, the stash can grow indefinitely. Without bounded mailboxes or stash capacity limits, the JVM will eventually crash with an OutOfMemoryError (OOM) as the system attempts to buffer thousands of pending requests during the outage.</p>",
    "root_cause": "Use of unbounded mailboxes and stashes without backpressure mechanisms or circuit breakers during prolonged downstream unavailability.",
    "bad_code": "public class MyActor extends AbstractActorWithStash {\n    @Override\n    public Receive createReceive() {\n        return receiveBuilder()\n            .match(Data.class, d -> stash()) // Unbounded stash leakage\n            .build();\n    }\n}",
    "solution_desc": "Implement BoundedMailboxes in configuration and define a 'stash-capacity' in the Akka actor system settings to drop or redirect messages when thresholds are met.",
    "good_code": "akka.actor.deployment {\n  /my-actor {\n    mailbox = bounded-mailbox\n  }\n}\nbounded-mailbox {\n  mailbox-type = \"akka.dispatch.BoundedMailbox\"\n  mailbox-capacity = 1000\n  mailbox-push-timeout-time = 0s\n}\nakka.actor.default-mailbox.stash-capacity = 500",
    "verification": "Run a load test while disabling the downstream service; verify that 'DroppedMessage' events appear in logs instead of OOM.",
    "date": "2026-04-19",
    "id": 1776576106,
    "type": "error"
});