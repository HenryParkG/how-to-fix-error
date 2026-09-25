window.onPostDataLoaded({
    "title": "gRPC HTTP/2 Flow-Control Window Exhaustion & Stream Deadlocks",
    "slug": "grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "DEADLINE_EXCEEDED",
    "tags": [
        "gRPC",
        "HTTP2",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>gRPC multiplexes concurrent remote procedure calls over a single underlying HTTP/2 TCP connection. HTTP/2 enforces flow control at two distinct granularities: stream-level and connection-level. Both maintain a dynamic receive window (default 65,535 bytes) initialized by the <code>SETTINGS_INITIAL_WINDOW_SIZE</code> frame. Whenever an endpoint transmits data frames, the available window size decrements; it only refills when the receiver consumes the bytes and returns a <code>WINDOW_UPDATE</code> frame.</p><p>When a client or server processes streaming responses slowly or synchronizes operations across multiplexed streams without concurrent consumption, the stream's window drains to zero. If other streams share the connection and consume the global connection flow-control window while blocked on downstream work, the entire HTTP/2 connection locks up. Calls to <code>Stream.Send()</code> block indefinitely waiting for a <code>WINDOW_UPDATE</code> that can never arrive, resulting in cascade <code>codes.DeadlineExceeded</code> errors across unrelated RPC streams.</p>",
    "root_cause": "Consuming gRPC streaming channels synchronously without background draining buffers, combined with small default HTTP/2 stream and connection flow-control windows that exhaust under high message throughput.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"google.golang.org/grpc\"\n\tpv \"example.com/proto/v1\"\n)\n\nfunc ProcessStreams(client pv.DataServiceClient, ids []string) error {\n\t// Buggy: Client defaults to 64KB HTTP/2 windows and blocks sequentially\n\tconn, _ := grpc.Dial(\"api.internal:50051\", grpc.WithInsecure())\n\tdefer conn.Close()\n\n\tstream, err := client.BulkExport(context.Background(), &pv.ExportRequest{})\n\tif err != nil { return err }\n\n\tfor {\n\t\t// If internal heavy processing blocks here, stream buffer fills.\n\t\t// TCP window stays open, but HTTP/2 window exhausts; connection deadlocks.\n\t\tres, err := stream.Recv()\n\t\tif err != nil { break }\n\t\tExecuteSlowSynchronousStorage(res)\n\t}\n\treturn nil\n}",
    "solution_desc": "Expand HTTP/2 flow-control windows at the transport configuration level using grpc.InitialWindowSize and grpc.InitialConnWindowSize. Decouple RPC ingestion from message processing using dedicated worker goroutines and bounded queues to keep WINDOW_UPDATE frames flowing continuously.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"google.golang.org/grpc\"\n\tpv \"example.com/proto/v1\"\n)\n\nfunc ConnectOptimized(target string) (*grpc.ClientConn, error) {\n\treturn grpc.Dial(\n\t\ttarget,\n\t\tgrpc.WithInsecure(),\n\t\t// Enlarge stream window to 4MB and connection window to 16MB\n\t\tgrpc.WithInitialWindowSize(4*1024*1024),\n\t\tgrpc.WithInitialConnWindowSize(16*1024*1024),\n\t)\n}\n\nfunc ProcessStreamsConcurrently(ctx context.Context, stream pv.DataService_BulkExportClient) {\n\tmsgChan := make(chan *pv.ExportResponse, 1024)\n\n\t// Separate ingress pump to continuously clear HTTP/2 frame window\n\tgo func() {\n\t\tdefer close(msgChan)\n\t\tfor {\n\t\t\tmsg, err := stream.Recv()\n\t\t\tif err != nil { return }\n\t\t\tmsgChan <- msg\n\t\t}\n\t}()\n\n\t// Worker pool drains buffered channel without stalling transport\n\tfor msg := range msgChan {\n\t\tExecuteSlowSynchronousStorage(msg)\n\t}\n}",
    "verification": "Enable HTTP/2 trace logs via `GODEBUG=http2debug=2` to observe continuous `WINDOW_UPDATE` frames without window exhaustion down to 0 bytes, and verify stable latencies under heavy streaming loads.",
    "date": "2026-09-25",
    "id": 1790345929,
    "type": "error"
});