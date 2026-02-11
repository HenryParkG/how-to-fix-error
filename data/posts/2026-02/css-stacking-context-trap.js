window.onPostDataLoaded({
    "title": "The Stacking Context Trap: Why z-index: 9999 Fails",
    "slug": "css-stacking-context-trap",
    "language": "CSS",
    "code": "StackingContextMismatch",
    "tags": [
        "CSS",
        "Frontend",
        "WebDev",
        "UI",
        "Error Fix"
    ],
    "analysis": "<p>Many developers treat z-index as a global layer hierarchy, assuming that a higher number always places an element on top of a lower one. However, z-index is relative to the element's current Stacking Context.</p><p>A stacking context is formed by any element that meets specific criteria, such as having a position value other than static combined with a z-index, or properties like opacity less than 1, transform, filter, or perspective. When a new stacking context is created, all its children are flattened relative to the parent's level in the global stack. This means a child with z-index: 9999 trapped inside a low-priority stacking context will always appear behind an element in a higher context, even if that element has z-index: 1.</p>",
    "root_cause": "An element's z-index only applies within its own stacking context. If a parent element creates a new stacking context (via opacity, transform, etc.), its children cannot move above elements that are outside and 'higher' than that parent in the root context.",
    "bad_code": ".parent-container {\n  opacity: 0.9; /* Creates a new stacking context */\n  position: relative;\n  z-index: 1;\n}\n\n.child-tooltip {\n  position: absolute;\n  z-index: 9999; /* This will still be trapped below .sibling-header */\n}\n\n.sibling-header {\n  position: relative;\n  z-index: 2;\n}",
    "solution_desc": "To fix this, you must either move the element outside the restricted stacking context (often using a Portal in frameworks like React) or ensure the parent element that creates the stacking context has a z-index high enough to compete with its siblings. Alternatively, you can use 'isolation: isolate' on a container to explicitly manage where a new context begins.",
    "good_code": "/* Method: Move the high-priority element to the body or a top-level container */\n.modal-portal {\n  position: fixed;\n  top: 0;\n  left: 0;\n  z-index: 9999; /* Now compares against the root context */\n}\n\n/* Method: Ensure parent has correct relative z-index */\n.parent-container {\n  position: relative;\n  z-index: 10; /* Higher than .sibling-header */\n  opacity: 0.9;\n}",
    "verification": "Open Browser DevTools, go to the 'Layers' panel (Chrome) or '3D View' (Firefox) to visualize the stacking contexts and identify which property (e.g., transform, opacity) is triggering the local context.",
    "date": "2026-02-11",
    "id": 1770773285
});