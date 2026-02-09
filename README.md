# ErrorLog - Automated Bug Fix Repository

A modern, glassmorphism-styled website for documenting and sharing programming error solutions. Designed to be hosted on GitHub Pages.

## 🚀 Features

*   **Dynamic Search**: Filter errors by language (Python, JS, C++) or search by keywords.
*   **Premium UI**: Dark mode with neon accents and glassmorphism effects.
*   **Responsive**: Works on desktop and mobile.
*   **Easy to Update**: Add new error solutions by simply updating a JSON-like data file.

## 📂 Project Structure

```
├── index.html       # Main entry point
├── styles.css       # Styling (animations, glassmorphism)
├── script.js        # Logic for rendering and search
├── data/
│   └── posts.js     # Database of error solutions
└── README.md        # Documentation
```

## 🛠 How to Add a New Post

1.  Open `data/posts.js`.
2.  Add a new object to the `postsData` array:

```javascript
{
    id: 6, // Increment ID
    title: "New Error Title",
    language: "LanguageName",
    code: "ErrorCode",
    description: "Description of the error...",
    solution: "How to fix it...",
    snippet: "Code that causes error",
    fix: "Corrected code",
    date: "2024-06-01",
    views: 0,
    tags: ["tag1", "tag2"]
}
```

3.  Save the file. The website updates automatically.

## 🌐 Deployment to GitHub Pages

1.  Push this code to your GitHub repository.
2.  Go to **Settings** > **Pages**.
3.  Under **Source**, select `Deploy from a branch`.
4.  Select `main` (or `master`) branch and `/ (root)` folder.
5.  Click **Save**.
6.  Your site will be live at `https://[your-username].github.io/[repo-name]/`.

## 🤖 Future Automation Ideas

To achieve "automatic posting":
1.  **GitHub Issues as CMS**: Create a GitHub Action that triggers when a new Issue with a specific label (e.g., `bug-fix`) is closed.
2.  The Action parses the Issue body (Markdown).
3.  It appends the new entry to `data/posts.js`.
4.  It commits and pushes the change, automatically updating the site.
