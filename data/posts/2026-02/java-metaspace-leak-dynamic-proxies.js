window.onPostDataLoaded({
    "title": "Metaspace Leaks: Dynamic Proxies and Silent OOMs",
    "slug": "java-metaspace-leak-dynamic-proxies",
    "language": "Java",
    "code": "MetaspaceOOM",
    "tags": [
        "JVM",
        "MemoryManagement",
        "ReflectProxy",
        "Java8Plus",
        "Error Fix"
    ],
    "analysis": "<p>In modern JVMs (Java 8+), class metadata is stored in Metaspace, a region of native memory separate from the Heap. While this avoids the fixed-size constraints of the old PermGen, it introduces a risk: native memory exhaustion. Dynamic proxies—the backbone of AOP, Spring's @Transactional, and Hibernate—generate synthetic classes at runtime.</p><p>The JVM attempts to cache these generated classes using the defining ClassLoader and the set of implemented interfaces as a key. However, a leak occurs when applications repeatedly generate proxies using unique ClassLoader instances or high-cardinality interface combinations. Since class metadata is only reclaimed when its defining ClassLoader is garbage collected, a 'ClassLoader leak' effectively becomes a Metaspace leak. Because this occurs outside the Heap, your Heap usage might look healthy while the resident set size (RSS) of the process climbs until the OS kills it or the JVM throws an OutOfMemoryError.</p>",
    "root_cause": "Continuous generation of unique class metadata via dynamic proxies (JDK Proxy or CGLIB) combined with short-lived or non-reusable ClassLoaders, preventing the JVM from unloading obsolete class definitions from native memory.",
    "bad_code": "public Object getProxy(InvocationHandler handler) {\n    // Creating a new ClassLoader for every proxy prevents class reuse\n    // and leads to Metaspace exhaustion\n    ClassLoader transientLoader = new URLClassLoader(new URL[0], MyClass.class.getClassLoader());\n    return Proxy.newProxyInstance(\n        transientLoader, \n        new Class[] { MyInterface.class }, \n        handler\n    );\n}",
    "solution_desc": "Cache generated proxy classes or, more importantly, reuse the same ClassLoader for proxies of the same interface. Most frameworks (like Spring) do this by default, but manual implementations must ensure that the 'defining loader' remains stable to allow the JVM to find existing classes in the internal 'proxyCache'.",
    "good_code": "private static final ClassLoader SHARED_LOADER = MyClass.class.getClassLoader();\n\npublic Object getProxy(InvocationHandler handler) {\n    // Reuse the same ClassLoader to allow the JVM to lookup \n    // and return the existing generated proxy class from internal cache\n    return Proxy.newProxyInstance(\n        SHARED_LOADER, \n        new Class[] { MyInterface.class }, \n        handler\n    );\n}",
    "verification": "Run the application with -XX:MaxMetaspaceSize=64m. Monitor usage via 'jstat -gc [pid]' or 'jcmd [pid] VM.metaspace'. If Metaspace remains stable under load, the fix is successful.",
    "date": "2026-02-12",
    "id": 1770859189,
    "type": "error"
});