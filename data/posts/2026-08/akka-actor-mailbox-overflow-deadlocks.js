window.onPostDataLoaded({
    "title": "Resolving Akka Actor Mailbox Overflow & Deadlocks",
    "slug": "akka-actor-mailbox-overflow-deadlocks",
    "language": "Java",
    "code": "MailboxOverflowException",
    "tags": [
        "Akka",
        "Concurrency",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>When high-throughput upstream producers push messages to Akka actors faster than the processing actor can handle them, unbounded mailboxes consume excessive JVM heap until an <code>OutOfMemoryError</code> occurs. If bounded mailboxes are introduced without backpressure handling, message drops or <code>MessageQueueAppendFailedException</code> occur. Furthermore, if actors use blocking <code>Patterns.ask</code> calls within circular dependencies during high load, thread starvation causes system-wide cascading deadlocks.</p>",
    "root_cause": "Lack of backpressure in push-based actor messaging combined with blocking Ask timeouts under saturated thread dispatchers.",
    "bad_code": "public class IngestionActor extends AbstractActor {\n    // Configured with bounded mailbox: bounded-mailbox.mailbox-capacity = 100\n    private final ActorRef workerActor;\n\n    public IngestionActor(ActorRef workerActor) {\n        this.workerActor = workerActor;\n    }\n\n    @Override\n    public Receive createReceive() {\n        return receiveBuilder()\n            .match(EventPayload.class, event -> {\n                // BUG: Blocking ask inside bounded actor mailbox.\n                // Exhausts dispatcher threads and overflows worker mailbox.\n                Timeout timeout = Timeout.create(Duration.ofSeconds(5));\n                CompletableFuture<Object> future = Patterns.ask(workerActor, event, timeout).toCompletableFuture();\n                Object result = future.get(); // Blocking call creates deadlocks\n                getSender().tell(result, getSelf());\n            })\n            .build();\n    }\n}",
    "solution_desc": "Replace push-based actor interactions and blocking ask calls with reactive streams (Akka Streams / Pekko Streams) using backpressured queues, or adopt an explicit pull-based model where downstream workers request work batches when ready.",
    "good_code": "public class StreamIngestionService {\n    private final SourceQueueWithComplete<EventPayload> queue;\n\n    public StreamIngestionService(ActorSystem system, ActorRef workerActor) {\n        this.queue = Source.<EventPayload>queue(1000, OverflowStrategy.backpressure())\n            .mapAsync(8, event -> {\n                Timeout timeout = Timeout.create(Duration.ofSeconds(5));\n                // Non-blocking ask piped to completion stage\n                return Patterns.ask(workerActor, event, timeout)\n                               .thenApply(response -> (ProcessedResult) response);\n            })\n            .to(Sink.foreach(result -> {\n                // Handle processed result asynchronously\n            }))\n            .run(system);\n    }\n\n    public CompletionStage<QueueOfferResult> ingest(EventPayload event) {\n        // Applies true reactive backpressure to producer\n        return queue.offer(event);\n    }\n}",
    "verification": "Run a load test with 5x nominal throughput using Gatling/JMeter. Verify via Kamon/Micrometer metrics that actor mailbox depth remains stable and JVM heap usage stays bounded without thread pool exhaustion.",
    "date": "2026-08-27",
    "id": 1787851310,
    "type": "error"
});