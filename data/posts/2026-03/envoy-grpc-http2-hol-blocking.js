window.onPostDataLoaded({
    "title": "Mitigating Envoy Head-of-Line Blocking in gRPC",
    "slug": "envoy-grpc-http2-hol-blocking",
    "language": "Go",
    "code": "Stream Stalling",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In gRPC-over-HTTP/2 environments, a single slow stream can inadvertently block other streams on the same TCP connection. This occurs when the HTTP/2 flow control window is exhausted or when packet loss triggers TCP-level Head-of-Line (HoL) blocking. While HTTP/2 multiplexes streams, it still relies on a single underlying TCP pipe, and Envoy's default buffer limits can exacerbate the stall if not tuned for high-throughput streaming.</p>",
    "root_cause": "Default HTTP/2 flow control windows (64KB) are too small for high-bandwidth gRPC streams, leading to window exhaustion where the sender waits for ACK frames before sending more data.",
    "bad_code": "clusters:\n- name: grpc_service\n  connect_timeout: 0.25s\n  type: LOGICAL_DNS\n  # Missing flow control tuning\n  http2_protocol_options: {} ",
    "solution_desc": "Increase the initial_stream_window_size and initial_connection_window_size in the Envoy cluster configuration to allow more in-flight data per stream.",
    "good_code": "clusters:\n- name: grpc_service\n  http2_protocol_options:\n    initial_stream_window_size: 6553600 # 6MB\n    initial_connection_window_size: 10485760 # 10MB\n    max_concurrent_streams: 100",
    "verification": "Monitor Envoy metrics 'upstream_cx_http2_decode_errors' and 'cluster.grpc_service.upstream_rq_time' to ensure latency is consistent.",
    "date": "2026-03-30",
    "id": 1774847871,
    "type": "error"
});