window.onPostDataLoaded({
    "title": "Fixing Rust Lifetime Variance Mismatches in HRTBs",
    "slug": "rust-lifetime-variance-hrtb-fix",
    "language": "Rust",
    "code": "HRTB-Variance-Mismatch",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Higher-Rank Trait Bounds (HRTBs) allow a trait bound to be satisfied for all possible lifetimes using the <code>for<'a></code> syntax. A common error occurs when the compiler detects a variance mismatch\u2014specifically when a function expects a generic lifetime but receives a concrete one that doesn't satisfy the 'for all' requirement, or when subtyping rules for function pointers conflict with the expected variance of the arguments.</p>",
    "root_cause": "The compiler cannot unify a specific, concrete lifetime from the caller's scope with the late-bound lifetime required by the HRTB in the function signature.",
    "bad_code": "fn process_data<F>(func: F) \nwhere F: for<'a> Fn(&'a str) -> &'a str \n{\n    let s = String::from(\"data\");\n    func(&s);\n}\n\nfn main() {\n    let local_suffix = String::from(\"!\");\n    // Error: closure captures local_suffix, breaking HRTB\n    process_data(|input| {\n        println!(\"{}{}\", input, local_suffix);\n        input\n    });\n}",
    "solution_desc": "To fix this, avoid capturing local variables with restricted lifetimes in closures passed to HRTB functions. Alternatively, use a trait with a generic method or wrap the state in a way that respects the required variance.",
    "good_code": "fn process_data<F>(func: F) \nwhere F: for<'a> Fn(&'a str) -> &'a str \n{\n    let s = String::from(\"data\");\n    func(&s);\n}\n\nfn main() {\n    // The closure no longer captures specific local lifetimes\n    process_data(|input| {\n        println!(\"{}\", input);\n        input\n    });\n}",
    "verification": "Run `cargo check`. If the variance mismatch is resolved, the compiler will no longer emit 'implementation of `FnOnce` is not general enough' errors.",
    "date": "2026-04-18",
    "id": 1776475512,
    "type": "error"
});