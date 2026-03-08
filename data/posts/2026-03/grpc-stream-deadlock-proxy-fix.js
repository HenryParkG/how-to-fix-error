window.onPostDataLoaded({
    "title": "Resolving gRPC Stream Deadlocks in Proxy Chains",
    "slug": "grpc-stream-deadlock-proxy-fix",
    "language": "Go",
    "code": "FlowControlDeadlock",
    "tags": [
        "Go",
        "Backend",
        "gRPC",
        "Error Fix"
    ],
    "analysis": "<p>Bidirectional gRPC streams in proxy chains (Client -> Proxy -> Server) are susceptible to deadlocks when HTTP/2 flow control windows are exhausted. If the proxy waits to read from the client before writing to the server, and the client is waiting for a server response before sending more data, the entire chain stalls because the flow control window cannot increment.</p>",
    "root_cause": "Synchronous processing of bidirectional streams where the proxy's read and write operations are coupled, leading to a circular dependency on the HTTP/2 window update frames.",
    "bad_code": "func (p *Proxy) Stream(srv pb.Service_StreamServer) error {\n    for {\n        req, _ := srv.Recv()\n        // Blocking call: waiting for server to accept before reading next client msg\n        resp, _ := p.client.SendAndReceive(req)\n        srv.Send(resp)\n    }\n}",
    "solution_desc": "Implement independent goroutines for the upstream and downstream directions with internal buffering. Use a channel-based pipe to decouple the read and write paths, allowing window updates to flow independently.",
    "good_code": "func (p *Proxy) Stream(srv pb.Service_StreamServer) error {\n    errCtx, cancel := context.WithCancel(srv.Context())\n    go func() {\n        for {\n            req, _ := srv.Recv()\n            upstream.Send(req)\n        }\n    }()\n    go func() {\n        for {\n            resp, _ := upstream.Recv()\n            srv.Send(resp)\n        }\n    }()\n    <-errCtx.Done()\n    return nil\n}",
    "verification": "Use 'ghz' to simulate high-concurrency bidirectional streams and monitor 'grpc_server_msg_received_total' to ensure zero throughput stalls.",
    "date": "2026-03-08",
    "id": 1772961661,
    "type": "error"
});