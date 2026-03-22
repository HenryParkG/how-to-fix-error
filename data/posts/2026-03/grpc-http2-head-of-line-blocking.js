window.onPostDataLoaded({
    "title": "Solving gRPC Head-of-Line Blocking in HTTP/2",
    "slug": "grpc-http2-head-of-line-blocking",
    "language": "Go",
    "code": "Performance Bottleneck",
    "tags": [
        "Go",
        "gRPC",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>While HTTP/2 solves the application-level Head-of-Line (HOL) blocking found in HTTP/1.1 via multiplexing, it is still vulnerable to TCP-level HOL blocking. A single dropped packet stalls the entire TCP connection, impacting all multiplexed gRPC streams. Under high latency or lossy networks, this results in significant tail latency spikes (P99).</p>",
    "root_cause": "The underlying TCP protocol treats the entire HTTP/2 stream as a single opaque sequence of bytes; a lost packet requires a retransmission before any subsequent data in the buffer can be processed.",
    "bad_code": "import \"google.golang.org/grpc\"\n\n// Default behavior: All requests share a single TCP connection\nconn, _ := grpc.Dial(\"api.service.internal:50051\", grpc.WithInsecure())\nclient := pb.NewServiceClient(conn)\n// High concurrency here will suffer if one packet is lost",
    "solution_desc": "The most effective architectural fix is to implement connection pooling at the client level. By distributing streams across multiple TCP connections, a single packet loss only affects a fraction of the traffic. Alternatively, migrating to gRPC-over-HTTP/3 (QUIC) eliminates TCP HOL blocking entirely.",
    "good_code": "type ConnPool struct {\n    conns []*grpc.ClientConn\n    next  uint32\n}\n\nfunc (p *ConnPool) Get() *grpc.ClientConn {\n    idx := atomic.AddUint32(&p.next, 1) % uint32(len(p.conns))\n    return p.conns[idx]\n}\n\n// Initialize with N underlying TCP connections\nfor i := 0; i < 8; i++ {\n    c, _ := grpc.Dial(addr, opts...)\n    pool.conns = append(pool.conns, c)\n}",
    "verification": "Inject 1% packet loss using `tc qdisc` and compare P99 latency between a single connection and a pool of 8 connections.",
    "date": "2026-03-22",
    "id": 1774142396,
    "type": "error"
});