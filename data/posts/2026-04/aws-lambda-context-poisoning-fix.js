window.onPostDataLoaded({
    "title": "Mitigating AWS Lambda Execution Context Poisoning",
    "slug": "aws-lambda-context-poisoning-fix",
    "language": "Node.js",
    "code": "Lambda-State-Leak",
    "tags": [
        "AWS",
        "Node.js",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>AWS Lambda reuses execution environments (microVMs) for subsequent 'warm' requests to minimize cold start latency. Context poisoning occurs when global state, database connections, or variables are modified during one request and leak into another, potentially leading to cross-user data leakage or corrupted application logic.</p>",
    "root_cause": "Variables declared outside the handler function persist across multiple invocations without being reset or re-initialized.",
    "bad_code": "let currentUser = null;\n\nexport const handler = async (event) => {\n    // If this fails or doesn't clear, the next user sees previous user's data\n    currentUser = event.body.user;\n    return { body: `Hello, ${currentUser.name}` };\n};",
    "solution_desc": "Encapsulate request-specific state within the handler function scope. If global variables are necessary for caching (like DB clients), ensure they do not store user-specific session data.",
    "good_code": "export const handler = async (event) => {\n    // Define user state strictly inside the handler\n    const currentUser = event.body.user;\n    \n    // Shared resources should be checked but not used for session state\n    const db = await getDatabaseConnection(); \n    \n    return { body: `Hello, ${currentUser.name}` };\n};\n\nasync function getDatabaseConnection() {\n    if (!global.cachedDb) {\n        global.cachedDb = await connect();\n    }\n    return global.cachedDb;\n}",
    "verification": "Invoke the Lambda multiple times with different payloads and verify that the output of invocation N does not contain data from invocation N-1.",
    "date": "2026-04-18",
    "id": 1776475513,
    "type": "error"
});