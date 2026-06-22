window.onPostDataLoaded({
    "title": "Fixing Istio Envoy OOM via Headless Service",
    "slug": "fixing-istio-envoy-oom-headless-service",
    "language": "Kubernetes",
    "code": "Envoy OOMKilled",
    "tags": [
        "Kubernetes",
        "Docker",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale Kubernetes clusters, Envoy sidecars running alongside microservices can experience sudden Out-of-Memory (OOM) failures. This occurs when applications make use of dynamic headless services (such as large Kafka, Cassandra, or dynamically-scaled runner deployments) that contain thousands of pods. By default, Istio's control plane (istiod) pushes Endpoint Discovery Service (EDS) configurations for every single endpoint in the mesh to every single Envoy proxy. As dynamic instances scale up or churn, the routing table updates balloon, consuming hundreds of megabytes of RAM on every sidecar container until the Linux kernel terminates Envoy via OOM-killing.</p>",
    "root_cause": "The default dynamic routing configuration in Istio forces Envoy sidecars to build and store memory-intensive routing endpoints for all services within the entire mesh. Large headless services generate massive endpoint lists, leading to a dynamic config footprint that scales O(N*M) where N is endpoints and M is proxies.",
    "bad_code": "apiVersion: v1\nkind: Service\nmetadata:\n  name: headless-runner-service\n  namespace: runners\nspec:\n  clusterIP: None\n  selector:\n    app: worker-node\n  ports:\n    - port: 8080\n      targetPort: 8080\n# No Sidecar isolation resources are defined, exposing every namespace and pod to this global discovery map.",
    "solution_desc": "Implement Istio 'Sidecar' egress isolation resources to restrict dynamic discovery scopes. By scoping down what namespaces and endpoints a given workload can reach, you instruct istiod to prune the dynamic EDS configurations pushed to those specific sidecars, dropping Envoy's memory footprint from gigabytes to a few megabytes.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default-isolation\n  namespace: billing-prod\nspec:\n  egress:\n  - hosts:\n    - \"./*\"\n    - \"istio-system/*\"\n    - \"shared-services/database-service.shared-services.svc.cluster.local\"\n# Envoy will now discard routing tables for the thousands of 'runners' pods, keeping memory usage flat.",
    "verification": "Apply the Sidecar resource YAML to the target namespace. Execute 'kubectl top pods' and profile the Envoy memory footprint using 'istioctl dashboard envoy <pod-name>'. Confirm that Envoy's memory utilization drops instantly and remains stable even during massive rolling updates of your headless clusters.",
    "date": "2026-06-22",
    "id": 1782096623,
    "type": "error"
});