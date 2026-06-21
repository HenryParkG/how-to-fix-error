window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow Control Deadlocks",
    "slug": "fixing-grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "FlowControlDeadlock",
    "tags": [
        "Go",
        "gRPC",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>HTTP/2 relies on flow control windows at both the stream and connection level to prevent fast senders from overwhelming slow receivers. In high-throughput gRPC architectures, if a receiver blocks on processing a stream without consuming incoming payloads, the receive window drops to zero.</p><p>When the connection-level window is fully exhausted, no further data can be transmitted on any multiplexed streams sharing that connection. If the sending service blocks synchronously waiting for window space to free up while holding a mutex or thread resource, this can trigger a cascading deadlock across your entire microservices mesh.</p>",
    "root_cause": "The receiver application blocked on a slow downstream operation (like a synchronous database write or unbuffered channel send) while holding up the gRPC transport thread, preventing the emission of HTTP/2 `WINDOW_UPDATE` frames and exhausting the shared connection window.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"google.golang.org/grpc\"\n\t\"log\"\n)\n\ntype StreamServer struct {}\n\nfunc (s *StreamServer) ProcessData(stream grpc.ServerStream) error {\n\tfor {\n\t\tmsg, err := stream.Recv()\n\t\tif err != nil {\n\t\t\treturn err\n\t\t}\n\n\t\t// BUG: Synchronous slow blocking database write.\n\t\t// Blocks the transport read loop, causing HTTP/2 stream receiver queue to fill\n\t\t// up. This halts flow control updates across the entire shared TCP connection.\n\t\twriteToDatabase(msg)\n\t}\n}\n\nfunc writeToDatabase(msg interface{}) {\n\t// Simulates deep network blocking\n\tselect {}\n}",
    "solution_desc": "Decouple HTTP/2 frame reading from application processing. Read incoming messages off the stream as fast as possible, queueing them in bounded memory buffers (channels), and process them using worker pools. Ensure configure explicit limits on stream and connection windows via gRPC's `InitialWindowSize` and `InitialConnWindowSize` configurations to absorb traffic spikes.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"google.golang.org/grpc\"\n\t\"log\"\n)\n\ntype StreamServer struct {}\n\nfunc (s *StreamServer) ProcessData(stream grpc.ServerStream) error {\n\tctx, cancel := context.WithCancel(stream.Context())\n\tdefer cancel()\n\n\t// Decouple stream parsing and database updates\n\tjobChan := make(chan interface{}, 1000)\n\n\t// Worker pool\n\tgo func() {\n\t\tfor {\n\t\t\tselect {\n\t\t\tcase <-ctx.Done():\n\t\t\t\treturn\n\t\t\tcase msg := <-jobChan:\n\t\t\t\twriteToDatabase(msg)\n\t\t\t}\n\t\t}\n\t}()\n\n\tfor {\n\t\tmsg, err := stream.Recv()\n\t\tif err != nil {\n\t\t\tclose(jobChan)\n\t\t\treturn err\n\t\t}\n\n\t\tselect {\n\t\tcase jobChan <- msg:\n\t\tdefault:\n\t\t\t// Handle queue overflow to prevent memory exhaustion, dropping/rejecting gracefully\n\t\t\tlog.Println(\"Processing queue full; applying backpressure\")\n\t\t\tjobChan <- msg // Blocks here safely allowing gRPC flow control to kick in on this stream only\n\t\t}\n\t}\n}",
    "verification": "Profile connections with `GODEBUG=http2debug=2` to track HTTP/2 `WINDOW_UPDATE` and `SETTINGS` frames, and verify that stream exhaustion does not block other multiplexed streams on the same port.",
    "date": "2026-06-21",
    "id": 1782010067,
    "type": "error"
});