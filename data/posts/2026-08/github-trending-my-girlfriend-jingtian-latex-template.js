window.onPostDataLoaded({
    "title": "Inside 'my-girlfriend-jingtian-latex' CV Template",
    "slug": "github-trending-my-girlfriend-jingtian-latex-template",
    "language": "CSS",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "CSS"
    ],
    "analysis": "<p>The trending repository <strong>HEJustinSun/my-girlfriend-jingtian-latex</strong> has gained significant attention in developer and academic communities for its polished, modern LaTeX resume and curriculum vitae typesetting architecture. Designed with strict typographic spacing, customizable bilingual font management, and FontAwesome icon bindings, it eliminates common compile errors and alignment flaws prevalent in traditional CV templates.</p><p>It provides job seekers, software engineers, and researchers an automated, modular, and version-controlled workflow for producing professional, high-standard PDF resumes via XeLaTeX.</p>",
    "root_cause": "The repository stands out by offering modular section layouts, out-of-the-box CTeX Chinese/English typography support, clean margin controls via the geometry package, and zero-hassle local and cloud (Overleaf/GitHub Actions) build setups.",
    "bad_code": "# Clone repository and build PDF with XeLaTeX\ngit clone https://github.com/HEJustinSun/my-girlfriend-jingtian-latex.git\ncd my-girlfriend-jingtian-latex\n\n# Compile via command line engine\nxelatex resume.tex",
    "solution_desc": "Ideal for software developers, graduate students, and researchers wanting a robust, maintainable resume that complies with clean ATS-friendly typesetting standards and supports seamless dual-language formatting.",
    "good_code": "% Customizing personal metadata in resume.tex\n\\documentclass{jingtian-resume}\n\n\\name{Alex Doe}\n\\contact{alex.doe@example.com}{+1 (555) 019-2834}{github.com/alexdoe}{linkedin.com/in/alexdoe}\n\n\\begin{document}\n\\makeheader\n\n\\section{Technical Experience}\n\\entry{Senior Systems Engineer}{Infrastructure Corp}{2022 -- Present}\n\\begin{itemize}\n  \\item Designed fault-tolerant Kubernetes orchestration pipelines reducing P99 latency by 35\\%.\n  \\item Automated multi-region database failover policies across hybrid cloud environments.\n\\end{itemize}\n\n\\end{document}",
    "verification": "Inspect generated resume.pdf output using PDF viewing engines to confirm that embedded vector fonts, hyperlinked contact anchors, and line balance conform accurately without warnings or font fallback issues.",
    "date": "2026-08-29",
    "id": 1787979219,
    "type": "trend"
});