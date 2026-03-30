window.onPostDataLoaded({
    "title": "Istio mTLS Handshake Protocol Mismatch Debugging",
    "slug": "istio-mtls-handshake-mismatch-fix",
    "language": "Go",
    "code": "mTLSError",
    "tags": [
        "Infra",
        "Kubernetes",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In Istio service meshes, mTLS certificate rotation is handled by Envoy through the Secret Discovery Service (SDS). A protocol mismatch occurs when the control plane (istiod) pushes a new trust bundle, but a sidecar proxy is still using an old certificate or hasn't updated its ALPN (Application-Layer Protocol Negotiation) settings. During this window, connections are rejected with 'TLS Handshake: Unknown Protocol' or 'Internal Error' because the client and server cannot agree on the 'istio' ALPN identifier or the root of trust.</p>",
    "root_cause": "Synchronization lag between SDS certificate delivery and the DestinationRule/PeerAuthentication policy enforcement, leading to ALPN mismatches (e.g., 'istio-peer-exchange' vs 'http/1.1').",
    "bad_code": "apiVersion: security.istio.io/v1beta1\nkind: PeerAuthentication\nmetadata:\n  name: default\nspec:\n  mtls:\n    mode: STRICT # Fails if rotation isn't synchronized across all pods",
    "solution_desc": "Transition to mTLS using 'PERMISSIVE' mode during certificate rotation or migrations. Use 'ProxyConfig' to increase the grace period for certificate updates and ensure that the 'DestinationRule' matches the server's authentication policy.",
    "good_code": "apiVersion: security.istio.io/v1beta1\nkind: PeerAuthentication\nmetadata:\n  name: default\nspec:\n  mtls:\n    mode: PERMISSIVE # Allow both mTLS and Plaintext during rotation\n---\napiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: internal-api\nspec:\n  host: api.svc.cluster.local\n  trafficPolicy:\n    tls:\n      mode: ISTIO_MUTUAL",
    "verification": "Check 'istioctl proxy-status' to ensure config synchronization and use 'openssl s_client -alpn istio' to verify the handshake manually.",
    "date": "2026-03-30",
    "id": 1774865315,
    "type": "error"
});