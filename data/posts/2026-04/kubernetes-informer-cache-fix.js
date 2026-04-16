window.onPostDataLoaded({
    "title": "Fixing K8s Informer Cache Inconsistency in Controllers",
    "slug": "kubernetes-informer-cache-fix",
    "language": "Go",
    "code": "CacheInconsistency",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Admission controllers or scaling operators often face 'stale read' issues where the Informer cache has not yet synchronized with the API server's latest state. In a rapid scaling event, a controller might see 5 replicas in its cache while the cluster actually has 10, leading to incorrect scaling decisions or resource conflicts because the controller logic operates on outdated metadata.</p>",
    "root_cause": "Relying on the Informer Lister without checking for synchronization status or failing to handle the 'ResourceVersion' correctly during high-frequency update bursts.",
    "bad_code": "func (c *Controller) Reconcile(obj interface{}) {\n    // Potential stale read from local cache\n    pod, _ := c.podLister.Pods(\"default\").Get(\"my-pod\")\n    if pod.Status.Phase == v1.PodRunning {\n        // Logic based on potentially old data\n    }\n}",
    "solution_desc": "Always check if the Informer has synced before processing. For critical decision paths, use a 'Live Client' (Direct API read) or implement a check that compares the ResourceVersion of the cached object against the expected version from the event metadata.",
    "good_code": "if !cache.WaitForCacheSync(stopCh, c.podInformer.HasSynced) {\n    return fmt.Errorf(\"timed out waiting for caches to sync\")\n}\n\n// For critical logic, bypass cache or verify version\npod, err := c.kubeClient.CoreV1().Pods(ns).Get(ctx, name, metav1.GetOptions{})\nif err != nil {\n    return err\n}",
    "verification": "Deploy a scale-test script that creates 500 pods in 10 seconds. Check controller logs to ensure no 'ResourceConflict' errors or duplicate operations occur.",
    "date": "2026-04-16",
    "id": 1776334110,
    "type": "error"
});