window.onPostDataLoaded({
    "title": "Fixing Go Scheduler Starvation and Channel Leakage",
    "slug": "go-scheduler-starvation-unbuffered-channel",
    "language": "Go",
    "code": "Goroutine Leak",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Go's concurrency model depends on work-stealing scheduling (the G-M-P model). However, concurrency bugs like leaking goroutines can lead to scheduler starvation and slow memory exhaustion. A classic cause of this leak is sending values to an unbuffered channel with no active receiver.</p><p>When a worker goroutine attempts to write execution results back to an unbuffered channel, it blocks until a receiver reads from it. If the parent context timed out or exited early, the receiver terminates, leaving the worker goroutine permanently blocked on the send operation. Because the goroutine cannot progress, its stack memory (ranging from 2KB upwards) and all enclosed heap objects are pinned. Over time, these dangling goroutines build up, starving the OS threads and leading to a quiet but fatal memory depletion.</p>",
    "root_cause": "The worker goroutine attempts to send a result to an unbuffered channel. Because the main consumer exited early due to context cancellation, there is no active receiver. The sending goroutine blocks permanently, preventing Go's garbage collector from reclaiming its stack and referenced heap variables.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc processRequest(ctx context.Context) (string, error) {\n\tch := make(chan string) // Unbuffered channel\n\n\tgo func() {\n\t\ttime.Sleep(2 * time.Second) // Simulate intensive operation\n\t\tch <- \"Job Completed\"        // BLOCKS here indefinitely if context times out!\n\t}()\n\n\tselect {\n\tcase res := <-ch:\n\t\treturn res, nil\n\tcase <-ctx.Done():\n\t\treturn \"\", ctx.Err() // Exits early, closing receiver pipeline\n\t}\n}",
    "solution_desc": "Change the unbuffered channel to a buffered channel with a capacity of 1. This permits the async worker goroutine to deliver its result and exit cleanly, even if the main thread has already timed out and abandoned the channel. Alternatively, use a select block with a default branch or a context check to abort the send operation if the channel remains unread.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc processRequest(ctx context.Context) (string, error) {\n\t// Use a buffered channel of size 1 so the worker can write and exit without waiting\n\tch := make(chan string, 1)\n\n\tgo func() {\n\t\ttime.Sleep(2 * time.Second)\n\t\tselect {\n\t\tcase ch <- \"Job Completed\":\n\t\t\t// Successfully written\n\t\tcase <-ctx.Done():\n\t\t\t// Avoid blocking if the context was already canceled\n\t\t}\n\t}()\n\n\tselect {\n\tcase res := <-ch:\n\t\treturn res, nil\n\tcase <-ctx.Done():\n\t\treturn \"\", ctx.Err()\n\t}\n}",
    "verification": "Profile the application using 'runtime.NumGoroutine()' or run 'go test -run=^$ -bench=. -memprofile mem.out' alongside a pprof Goroutine profile inspect tool. Verify that the number of active goroutines stabilizes and returns to baseline levels after context cancellation.",
    "date": "2026-06-27",
    "id": 1782526507,
    "type": "error"
});