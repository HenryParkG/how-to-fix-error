window.onPostDataLoaded({
    "title": "Fixing gRPC Head-of-Line Blocking in HTTP/2 Streams",
    "slug": "grpc-http2-hol-blocking-fix",
    "language": "Go",
    "code": "LatencySpike",
    "tags": [
        "gRPC",
        "Network",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>gRPC utilizes HTTP/2 for multiplexing multiple requests over a single TCP connection. While this reduces handshake overhead, it introduces a critical bottleneck: TCP-level Head-of-Line (HoL) blocking. If a single packet is lost, the entire TCP stream stalls, including all multiplexed gRPC calls, until the packet is retransmitted. In high-concurrency environments with even minor packet loss, this results in massive latency spikes that ignore the theoretical benefits of multiplexing.</p>",
    "root_cause": "HTTP/2 multiplexes multiple logical streams into one physical TCP connection; therefore, TCP's sequential reliability mechanism blocks all streams when one packet is dropped.",
    "bad_code": "// Standard single connection client prone to HoL blocking\nconn, _ := grpc.Dial(\"service:50051\", grpc.WithInsecure())\nclient := pb.NewServiceClient(conn)\n// All concurrent goroutines share this single 'conn'",
    "solution_desc": "Implement a connection pool for the gRPC client to distribute streams across multiple underlying TCP connections. This limits the blast radius of a single packet loss. Alternatively, migrate to gRPC-over-HTTP/3 (QUIC) which handles stream-level recovery.",
    "good_code": "// Implementing a simple round-robin connection pool\ntype ClientPool struct {\n    conns []*grpc.ClientConn\n    next  uint32\n}\n\nfunc (p *ClientPool) Get() *grpc.ClientConn {\n    idx := atomic.AddUint32(&p.next, 1) % uint32(len(p.conns))\n    return p.conns[idx]\n}",
    "verification": "Use `tc qdisc` to simulate 0.1% packet loss and measure the p99 latency difference between a single-connection client and a pooled client.",
    "date": "2026-02-24",
    "id": 1771895741,
    "type": "error"
});