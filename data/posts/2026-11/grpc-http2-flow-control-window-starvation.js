window.onPostDataLoaded({
    "title": "Resolving gRPC HTTP/2 Flow-Control Window Stalls",
    "slug": "grpc-http2-flow-control-window-starvation",
    "language": "Go",
    "code": "StreamDeadlock",
    "tags": [
        "gRPC",
        "HTTP/2",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>gRPC multiplexes concurrent remote procedure calls over a single persistent TCP connection using HTTP/2 frames. However, high-throughput bidirectional streams can experience sudden head-of-line blocking and deadlocks when individual stream consumers read data too slowly, causing flow-control starvation across other multiplexed RPCs.</p><p>HTTP/2 enforces flow control at both the stream level and the connection level using credit-based windows. If a slow consumer on one stream stops issuing 'WINDOW_UPDATE' frames, incoming data fills the stream's window, followed by the connection-level window. Once the connection-level window drops to zero, fast concurrent streams on the same transport connection cannot transmit or receive DATA frames, resulting in complete client-side or server-side stalls.</p>",
    "root_cause": "Default HTTP/2 flow control windows (64KB) are exhausted when a slow application handler blocks sequential message consumption on a multiplexed transport, causing the shared HTTP/2 connection window to starve concurrent independent streams.",
    "bad_code": "// Client with default flow control windows handling multiplexed streaming\nconn, err := grpc.Dial(\"backend:50051\", grpc.WithInsecure())\nif err != nil {\n    log.Fatal(err)\n}\nclient := pb.NewStreamServiceClient(conn)\nstream, _ := client.ProcessData(context.Background())\n\n// Slow consumer: processes payload synchronously without buffer decoupling\nfor {\n    resp, err := stream.Recv()\n    if err != nil { break }\n    // Heavy sync work blocks next Recv, preventing WINDOW_UPDATE emission\n    time.Sleep(500 * time.Millisecond)\n    processPayload(resp)\n}",
    "solution_desc": "Architectural remedy involves increasing 'InitialWindowSize' and 'InitialConnWindowSize' to match high Bandwidth-Delay Product (BDP) networks, and decoupling stream reception from message processing via buffered channels and worker routines so HTTP/2 flow-control frames are acknowledged without delay.",
    "good_code": "// Set flow control parameters to scale BDP and isolate consumption\nopts := []grpc.DialOption{\n    grpc.WithInsecure(),\n    grpc.WithInitialWindowSize(4 * 1024 * 1024),     // 4MB stream window\n    grpc.WithInitialConnWindowSize(16 * 1024 * 1024), // 16MB conn window\n}\nconn, err := grpc.Dial(\"backend:50051\", opts...)\nif err != nil { log.Fatal(err) }\n\nclient := pb.NewStreamServiceClient(conn)\nstream, _ := client.ProcessData(context.Background())\n\n// Decouple transport ingestion from execution worker\nmsgChan := make(chan *pb.DataResponse, 1024)\ngo func() {\n    for {\n        resp, err := stream.Recv()\n        if err != nil { close(msgChan); return }\n        msgChan <- resp // Rapid ingestion keeps HTTP/2 window open\n    }\n}()\n\ngo func() {\n    for resp := range msgChan {\n        processPayload(resp)\n    }\n}()",
    "verification": "Inspect HTTP/2 frame traces using 'GODEBUG=http2debug=2' to verify that WINDOW_UPDATE frames are emitted promptly, and ensure stream throughput remains unhindered across concurrent worker streams without socket buffer congestion.",
    "date": "2026-11-12",
    "id": 1794493755,
    "type": "error"
});