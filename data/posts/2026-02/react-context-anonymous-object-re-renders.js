window.onPostDataLoaded({
    "title": "React Context Value Trap: Stopping Re-render Storms",
    "slug": "react-context-anonymous-object-re-renders",
    "language": "React",
    "code": "ReferentialIdentityMismatch",
    "tags": [
        "React",
        "Performance",
        "Hooks",
        "ContextAPI",
        "Error Fix"
    ],
    "analysis": "<p>In React, the Context API determines whether consuming components should re-render by performing a shallow equality check (Object.is) on the value provided to the Provider. When you pass an anonymous object literal directly into the 'value' prop, you are creating a new memory reference on every single render of the parent component.</p><p>Even if the actual data inside the object hasn't changed, React sees a new reference and triggers a re-render for every component calling 'useContext' for that specific provider. In large applications, this creates a 're-render storm' that can significantly degrade UI responsiveness and lead to jank, as the reconciliation process is forced to run across entire sub-trees unnecessarily.</p>",
    "root_cause": "The provider's 'value' prop receives a new object reference on every render cycle due to inline object literal instantiation, failing the referential identity check in consumer components.",
    "bad_code": "function AuthProvider({ children }) {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(false);\n\n  // BUG: This object is recreated on every render of AuthProvider\n  return (\n    <AuthContext.Provider value={{ user, setUser, loading }}>\n      {children}\n    </AuthContext.Provider>\n  );\n}",
    "solution_desc": "To fix this, wrap the context value in the 'useMemo' hook. By providing a dependency array, React will only create a new object reference when the underlying state values actually change, maintaining referential identity across parent re-renders.",
    "good_code": "function AuthProvider({ children }) {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(false);\n\n  // FIX: Memoize the object so the reference only changes when dependencies do\n  const value = useMemo(() => ({\n    user,\n    setUser,\n    loading\n  }), [user, loading]);\n\n  return (\n    <AuthContext.Provider value={value}>\n      {children}\n    </AuthContext.Provider>\n  );\n}",
    "verification": "Open React DevTools Profiler, enable 'Record why each component rendered', and trigger a render in the parent component that does not update the context state. The consumer components should not show a re-render.",
    "date": "2026-02-11",
    "id": 1770803151,
    "type": "error"
});