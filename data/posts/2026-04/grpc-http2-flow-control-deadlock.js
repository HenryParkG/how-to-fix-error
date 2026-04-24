window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow Control Deadlocks",
    "slug": "grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "ResourceExhaustion",
    "tags": [
        "Go",
        "gRPC",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In bi-directional gRPC streams, deadlocks often occur when the HTTP/2 flow control window is exhausted on both ends. This typically happens when the sender fills the stream's buffer and the receiver's transport-level window, while the receiver is also blocked trying to send data to the sender. Because HTTP/2 multiplexes streams over a single TCP connection, a stall in flow control for one stream can eventually saturate the connection-level window, halting all communication.</p>",
    "root_cause": "The client and server are both performing synchronous writes to a stream with a fixed window size without concurrently draining the receive buffer, leading to a circular wait condition.",
    "bad_code": "func (s *server) BiStream(stream pb.Service_BiStreamServer) error {\n\tfor {\n\t\t// Synchronous write blocks if window is full\n\t\tif err := stream.Send(&pb.Resp{}); err != nil {\n\t\t\treturn err\n\t\t}\n\t\t// Recv is never reached if Send blocks\n\t\tmsg, _ := stream.Recv()\n\t\tprocess(msg)\n\t}\n}",
    "solution_desc": "Decouple reading and writing using separate goroutines. This ensures that the 'Recv' side continues to process incoming messages and send 'WINDOW_UPDATE' frames back to the peer, even if the 'Send' side is temporarily blocked by backpressure.",
    "good_code": "func (s *server) BiStream(stream pb.Service_BiStreamServer) error {\n\terrCh := make(chan error, 1)\n\tgo func() {\n\t\tfor {\n\t\t\tmsg, err := stream.Recv()\n\t\t\tif err != nil { errCh <- err; return }\n\t\t\tprocess(msg)\n\t\t}\n\t}()\n\tfor {\n\t\tselect {\n\t\tcase err := <-errCh: return err\n\t\tdefault:\n\t\t\tif err := stream.Send(&pb.Resp{}); err != nil { return err }\n\t\t}\n\t}\n}",
    "verification": "Monitor the 'grpc_server_msg_received_total' metric and use 'netstat' to check for full Send-Q buffers while the application is idle.",
    "date": "2026-04-24",
    "id": 1777008509,
    "type": "error"
});