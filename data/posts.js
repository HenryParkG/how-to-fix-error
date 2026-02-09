const postsData = [
    {
        id: 1,
        title: "TypeError: Cannot read properties of undefined (reading 'map')",
        language: "JavaScript",
        code: "TypeError",
        description: "This common JavaScript error occurs when you attempt to access a property or method on an undefined variable. Specifically, trying to use .map() on something that isn't an array.",
        solution: "ALWAYS validate that your variable is defined and is an array before mapping. You can use optional chaining (?.) or a simple logical AND (&&) check.",
        snippet: `const data = undefined;
// This throws the error
const names = data.map(item => item.name);`,
        fix: `const data = undefined;
// Fix 1: Optional Chaining
const names = data?.map(item => item.name) || [];

// Fix 2: Validation
if (Array.isArray(data)) {
    const names = data.map(item => item.name);
}`,
        date: "2024-05-20",
        views: 1542,
        tags: ["javascript", "frontend", "react"]
    },
    {
        id: 2,
        title: "AttributeError: 'NoneType' object has no attribute 'group'",
        language: "Python",
        code: "AttributeError",
        description: "Encountered in Python when using regular expressions (re module). If re.search() or re.match() fails to find a match, it returns None. Trying to call .group() on None causes this crash.",
        solution: "Check if the match object is not None before accessing groups.",
        snippet: `import re
match = re.search(r'(\\d+)', 'abc')
print(match.group(1)) # Crashes here`,
        fix: `import re
match = re.search(r'(\\d+)', 'abc')

if match:
    print(match.group(1))
else:
    print("No match found")`,
        date: "2024-05-18",
        views: 890,
        tags: ["python", "regex", "backend"]
    },
    {
        id: 3,
        title: "Segmentation fault (core dumped)",
        language: "C++",
        code: "SIGSEGV",
        description: "A classic C/C++ error occurring when a program attempts to access a memory location that it involves writing to a read-only portion of memory, or accessing memory that has been freed.",
        solution: "Use tools like Valgrind or GDB to trace the memory access. Common causes include dereferencing null pointers, array index out of bounds, or use-after-free.",
        snippet: `int* ptr = nullptr;
*ptr = 10; // Dereferencing null pointer`,
        fix: `int* ptr = new int(10);
if (ptr != nullptr) {
    *ptr = 10; // Safe access
    delete ptr;
    ptr = nullptr;
}`,
        date: "2024-05-15",
        views: 2100,
        tags: ["cpp", "memory", "system"]
    },
    {
        id: 4,
        title: "React Hook useEffect has a missing dependency",
        language: "JavaScript",
        code: "ESLint Warning",
        description: "The React hook useEffect relies on a dependency array to assume when to re-run. If you use a variable inside the effect that isn't in the array, you get this warning.",
        solution: "Include all variables used inside the effect in the dependency array, or use a functional update if updating state based on previous state.",
        snippet: `useEffect(() => {
    console.log(count);
}, []); // Missing 'count'`,
        fix: `useEffect(() => {
    console.log(count);
}, [count]); // Correctly dependent`,
        date: "2024-05-10",
        views: 3200,
        tags: ["javascript", "react", "hooks"]
    },
    {
        id: 5,
        title: "IndentationError: unexpected indent",
        language: "Python",
        code: "IndentationError",
        description: "Python relies on indentation to define code blocks. Mixing tabs and spaces or having inconsistent indentation levels will cause this error.",
        solution: "Configure your editor to use spaces instead of tabs (usually 4 spaces). Ensure all blocks are aligned correctly.",
        snippet: `def my_func():
  print("Hello")
    print("World") # Extra indentation`,
        fix: `def my_func():
    print("Hello")
    print("World") # Aligned correctly`,
        date: "2024-05-05",
        views: 560,
        tags: ["python", "formatting", "syntax"]
    }
];
