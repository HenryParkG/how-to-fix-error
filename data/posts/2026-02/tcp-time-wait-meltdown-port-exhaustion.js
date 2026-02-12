window.onPostDataLoaded({
    "title": "TCP TIME_WAIT: Solving Ephemeral Port Exhaustion",
    "slug": "tcp-time-wait-meltdown-port-exhaustion",
    "language": "Go / Linux",
    "code": "EADDRNOTAVAIL",
    "tags": [
        "Networking",
        "Performance",
        "Microservices",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency microservices, every outbound TCP connection requires a unique 4-tuple: source IP, source port, destination IP, and destination port. When a connection is closed by the client, the socket enters the TIME_WAIT state for twice the Maximum Segment Lifetime (2MSL), which is typically 60 seconds on Linux. This state ensures that delayed packets from the previous connection are not misinterpreted by a subsequent connection using the same parameters.</p><p>However, the Linux ephemeral port range is finite, often defaulting to roughly 28,000 available ports. If a service generates 500 requests per second and closes each connection immediately, it will exhaust the entire pool of available ports in less than a minute. Once the pool is empty, the kernel cannot assign a port to new outgoing requests, causing the application to throw 'assign requested address' errors, even if the server has plenty of CPU and memory available.</p>",
    "root_cause": "The rapid creation and closure of short-lived TCP connections faster than the kernel can recycle ports from the 60-second TIME_WAIT state.",
    "bad_code": "func GetUser(id string) (*User, error) {\n\t// BUG: Disabling Keep-Alives forces a new connection for every request\n\ttr := &http.Transport{DisableKeepAlives: true}\n\tclient := &http.Client{Transport: tr}\n\t\n\tresp, err := client.Get(\"http://user-service/\" + id)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tdefer resp.Body.Close()\n\t// ... decoding logic\n}",
    "solution_desc": "The primary fix is to reuse connections by maintaining a persistent connection pool (Keep-Alive). Ensure that you use a shared http.Client and tune MaxIdleConnsPerHost to match your expected concurrency. Additionally, for high-density environments, adjust the Linux kernel parameter net.ipv4.tcp_tw_reuse to 1, which allows the kernel to safely recycle ports in TIME_WAIT for new outgoing connections.",
    "good_code": "var (\n\t// Create a shared client to leverage connection pooling\n\thttpClient = &http.Client{\n\t\tTransport: &http.Transport{\n\t\t\tMaxIdleConns:        1000,\n\t\t\tMaxIdleConnsPerHost: 100, // Vital for microservices\n\t\t\tIdleConnTimeout:     90 * time.Second,\n\t\t},\n\t\tTimeout: 10 * time.Second,\n\t}\n)\n\nfunc GetUser(id string) (*User, error) {\n\tresp, err := httpClient.Get(\"http://user-service/\" + id)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\t// Must fully read and close body to return connection to the pool\n\tdefer resp.Body.Close()\n\tio.Copy(io.Discard, resp.Body)\n\t// ... decoding logic\n}",
    "verification": "Check current socket counts using 'ss -s' or 'netstat -ant | grep TIME_WAIT | wc -l'. During load tests, monitor for 'can't assign requested address' errors. Use 'sysctl net.ipv4.ip_local_port_range' to verify your available port pool size.",
    "date": "2026-02-12",
    "id": 1770859934,
    "type": "error"
});