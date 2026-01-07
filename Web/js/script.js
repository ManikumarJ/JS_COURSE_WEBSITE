document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const overlay = document.getElementById('overlay');
    const menuToggle = document.getElementById('menu-toggle');
    const searchInput = document.getElementById('search');

    // Sidebar Rendering
    function renderSidebar() {
        sidebar.innerHTML = '';
        const categories = {};

        // Group content
        topics.forEach(topic => {
            if (topic.hidden) return; // Skip hidden topics
            if (!categories[topic.category]) {
                categories[topic.category] = [];
            }
            categories[topic.category].push(topic);
        });

        for (const [category, items] of Object.entries(categories)) {
            const catHeader = document.createElement('div');
            catHeader.className = 'sidebar-title';
            catHeader.textContent = category;
            sidebar.appendChild(catHeader);

            items.forEach(topic => {
                const link = document.createElement('a');
                link.href = `#${topic.id}`;
                link.className = 'sidebar-link';
                link.textContent = topic.title;
                link.dataset.id = topic.id;
                sidebar.appendChild(link);
            });
        }
    }

    // Routing
    async function loadPage(id) {
        // Default to home if no id or id not found
        const topic = topics.find(t => t.id === id) || topics[0];

        // Update URL hash without triggering change loop if already there
        if (window.location.hash !== `#${topic.id}`) {
            history.replaceState(null, null, `#${topic.id}`);
        }

        // Toggle Sidebar Viisibility
        if (topic.hidden) {
            document.body.classList.add('hide-sidebar');
        } else {
            document.body.classList.remove('hide-sidebar');
        }

        // Highlight Sidebar
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.id === topic.id) link.classList.add('active');
        });

        // Load Content by Lookup
        try {
            content.innerHTML = '<div style="text-align:center; padding-top:50px;"><h2>Loading...</h2></div>';

            // Check if PAGES_DATA exists (bundled mode)
            if (typeof PAGES_DATA !== 'undefined' && PAGES_DATA[topic.file]) {
                content.innerHTML = PAGES_DATA[topic.file];
            } else {
                // Fallback to fetch for server environment if data not found
                const response = await fetch(`pages/${topic.file}`);
                if (!response.ok) throw new Error('Page not found');
                const html = await response.text();
                content.innerHTML = html;
            }


            // Re-highlight code if we were using a library, but here we just used styled pre blocks.
            // Add Copy Buttons
            document.querySelectorAll('pre').forEach(pre => {
                const btn = document.createElement('button');
                btn.className = 'copy-btn';
                btn.textContent = 'Copy';
                btn.onclick = () => {
                    navigator.clipboard.writeText(pre.childNodes[0].nodeValue || pre.textContent);
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                };
                pre.appendChild(btn);
            });

            // Add navigation buttons dynamically
            addNavButtons(topic.id);

            // Scroll to top
            window.scrollTo(0, 0);

            // Close mobile menu
            sidebar.classList.remove('show');
            overlay.classList.remove('show');

        } catch (error) {
            content.innerHTML = `<h2>Error Loading Page</h2><p>${error.message}</p>`;
        }
    }

    function addNavButtons(currentId) {
        const currentIndex = topics.findIndex(t => t.id === currentId);
        const prev = topics[currentIndex - 1];
        const next = topics[currentIndex + 1];

        const navDiv = document.createElement('div');
        navDiv.className = 'content-nav';

        if (prev) {
            const prevBtn = document.createElement('a');
            prevBtn.href = `#${prev.id}`;
            prevBtn.className = 'nav-btn';
            prevBtn.innerHTML = `&laquo; Previous`;
            navDiv.appendChild(prevBtn);
        } else {
            const placeholder = document.createElement('span'); // Spacer
            navDiv.appendChild(placeholder);
        }

        if (next) {
            const nextBtn = document.createElement('a');
            nextBtn.href = `#${next.id}`;
            nextBtn.className = 'nav-btn';
            nextBtn.innerHTML = `Next &raquo;`;
            navDiv.appendChild(nextBtn);
        }

        content.appendChild(navDiv);
    }

    // Hash Change listener
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        loadPage(hash);
    });

    // Initial Load
    renderSidebar();
    loadPage(window.location.hash.slice(1));


    // Mobile Menu
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const links = document.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            if (link.textContent.toLowerCase().includes(term)) {
                link.style.display = 'block';
            } else {
                link.style.display = 'none';
            }
        });
    });

    // Playground Logic
    const modal = document.getElementById('playground-modal');
    const closeBtn = document.getElementById('close-playground');
    const runBtn = document.getElementById('run-code');
    const editor = document.getElementById('code-editor');
    const outputFrame = document.getElementById('code-output');

    // Event delegation for "Try it Yourself" buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('try-btn')) {
            e.preventDefault();
            // Find the closest code block
            const codeBlock = e.target.previousElementSibling; // Assuming button is after pre
            if (codeBlock && codeBlock.tagName === 'PRE') {
                const code = codeBlock.textContent;
                openPlayground(code);
            }
        }
    });

    function openPlayground(code) {
        editor.value = code;
        runCode(code);
        modal.style.display = 'flex';
    }

    function runCode(codeObj) {
        // If codeObj is event or string
        const code = typeof codeObj === 'string' ? codeObj : editor.value;
        const doc = outputFrame.contentWindow.document;
        doc.open();
        // Inject script to capture console.log to document body for visibility if needed
        // But usually w3schools just shows alert or DOM manipulation.
        // We'll wrap it in a basic HTML structure
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head><style>body{font-family:sans-serif;}</style></head>
            <body>
                <div id="output"></div>
                <!-- Standard Containers for Examples -->
                <p id="demo"></p>
                <div id="txt"></div>
                <p id="p1">Hello World!</p>
                <p id="p2" style="color:red">Red Paragraph</p> <!-- For style example -->
                <button id="myBtn">Click Me</button> <!-- For event example -->
                
                <script>
                    // Redefine console.log to print to page
                    console.log = function(...args) {
                        const div = document.createElement('div');
                        div.style.borderBottom = "1px solid #eee";
                        div.style.padding = "2px";
                        div.textContent = "> " + args.join(' ');
                        // Insert at top or bottom? W3Schools console usually bottom.
                        document.getElementById('output').appendChild(div);
                    };
                    try {
                        ${code}
                    } catch(e) {
                         document.body.innerHTML += '<div style="color:red; font-weight:bold;">Error: ' + e + '</div>';
                    }
                </script>
            </body>
            </html>
        `);
        doc.close();
    }

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    runBtn.addEventListener('click', () => runCode());

});
