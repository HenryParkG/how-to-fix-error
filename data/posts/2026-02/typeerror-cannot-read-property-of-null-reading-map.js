window.onPostDataLoaded({
    "title": "TypeError: cannot read property of null (reading 'map')",
    "slug": "typeerror-cannot-read-property-of-null-reading-map",
    "language": "JavaScript/TypeScript",
    "code": "new_array = potentially_null_data.map(item => item.id);",
    "tags": [
        "JavaScript",
        "TypeError",
        "Null Handling",
        "Array Methods",
        "ES6"
    ],
    "analysis": "This is one of the most common TypeErrors in JavaScript, particularly when dealing with asynchronous data fetching (APIs, databases) or optional chaining that wasn't properly handled before ES2020. The error 'Cannot read property 'map' of null' means that the variable or expression preceding the '.map()' call evaluates to 'null'. The 'map' method is an intrinsic property of Array objects (Array.prototype.map()). When the runtime attempts to look up the 'map' property on 'potentially_null_data', it finds that 'potentially_null_data' is not an object (specifically, not an array) but 'null'. Accessing properties on 'null' (or 'undefined') throws a TypeError.",
    "root_cause": "Attempting to call the Array prototype method 'map()' on a variable that currently holds the value 'null'. This usually happens because data fetching failed, an API returned an explicit 'null' instead of an empty array, or initialization logic failed to provide a default array value.",
    "bad_code": [
        "function processData(data) {",
        "  // If 'data' is null, this line fails",
        "  const ids = data.map(item => item.id);",
        "  return ids;",
        "}",
        "",
        "processData(null); // TypeError"
    ],
    "solution_desc": "The primary solution is defensive programming: ensuring the variable is an iterable array before calling 'map()'. This can be achieved through: 1. A simple conditional check. 2. Providing a logical OR default value (empty array: []). 3. Using Optional Chaining (ECMAScript 2020+) to safely access the property, often combined with the Nullish Coalescing Operator (??) to provide a fallback array if the variable is null or undefined.",
    "good_code": [
        "// Solution 1: Logical OR (Most common and concise)",
        "const ids = (potentially_null_data || []).map(item => item.id);",
        "",
        "// Solution 2: Conditional Check",
        "let ids_conditional = [];",
        "if (potentially_null_data) {",
        "  ids_conditional = potentially_null_data.map(item => item.id);",
        "}",
        "",
        "// Solution 3: Optional Chaining (Safely handles reading 'map')",
        "// Combined with Nullish Coalescing (??) for the fallback value",
        "const ids_safe = potentially_null_data?.map(item => item.id) ?? [];"
    ],
    "verification": "The verification involves testing the code when 'potentially_null_data' is 'null', 'undefined', an empty array '[]', and a valid array '[{id: 1}]'. The robust solution (using '|| []' or '?? []') ensures that in all non-array cases, an empty array is used, preventing the TypeError and resulting in an empty output array, which is usually the desired behavior.",
    "date": "2026-02-09",
    "id": 1770608000
});