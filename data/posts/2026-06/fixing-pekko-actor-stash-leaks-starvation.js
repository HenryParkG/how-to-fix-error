window.onPostDataLoaded({
    "title": "Fixing Pekko Actor Stash Leaks & Starvation",
    "slug": "fixing-pekko-actor-stash-leaks-starvation",
    "language": "Scala / Pekko",
    "code": "ActorStashOverflowException",
    "tags": [
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Pekko (incubated from Akka), the <code>Stash</code> trait allows actors to temporarily buffer incoming messages that cannot be processed immediately in their current state. However, when asynchronous non-blocking patterns (like futures) complete, failure to execute standard transitions back to active processing, or neglecting to trigger <code>unstashAll()</code>, leaves the stashed elements in memory. This results in mailbox starvation for waiting requests, progressive garbage collector thrashing, and eventually an unrecoverable <code>ActorStashOverflowException</code>.</p>",
    "root_cause": "Forgetting to call unstashAll() during state transitions after future completions, or experiencing unhandled future exceptions that bypass state resets completely.",
    "bad_code": "import org.apache.pekko.actor.{Actor, Stash}\nimport scala.concurrent.Future\n\nclass DataSinkActor extends Actor with Stash {\n  import context.dispatcher\n  \n  def receive: Receive = active\n  \n  def active: Receive = {\n    case Save(data) =>\n      context.become(processing)\n      Future { performWrite(data) }.map(_ => Finished)\n    case _ =>\n      stash()\n  }\n  \n  def processing: Receive = {\n    case Finished =>\n      context.become(active) // BUG: Forgot to trigger unstashAll()!\n    case _ =>\n      stash() // Unbounded growth under backpressure\n  }\n}",
    "solution_desc": "Use standard safe transitions. Ensure that all futures pipe their result securely to the self-reference mailbox, and execute a state transition combined with a structured `unstashAll()` invocation within all possible execution paths (including failure scenarios). Keep stash capacities bounded via standard configurations.",
    "good_code": "import org.apache.pekko.actor.{Actor, Stash, Status}\nimport org.apache.pekko.pattern.pipe\nimport scala.concurrent.Future\n\nclass DataSinkActor extends Actor with Stash {\n  import context.dispatcher\n  \n  def receive: Receive = active\n  \n  def active: Receive = {\n    case Save(data) =>\n      context.become(processing)\n      Future { performWrite(data) }\n        .map(_ => Finished)\n        .recover { case ex => Status.Failure(ex) }\n        .pipeTo(self)\n    case _ =>\n      stash()\n  }\n  \n  def processing: Receive = {\n    case Finished =>\n      context.become(active)\n      unstashAll() // Clean recovery of waiting messages\n    case Status.Failure(ex) =>\n      log.error(\"Write failed\", ex)\n      context.become(active)\n      unstashAll() // Always release stashed objects on error\n    case _ =>\n      stash()\n  }\n}",
    "verification": "Inspect queue telemetry and run high-stress performance checks using Pekko's TestKit. Verify that the stash size returns to zero when workloads normalize.",
    "date": "2026-06-20",
    "id": 1781938533,
    "type": "error"
});