document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');

    function renderContent(title, content) {
        appContainer.innerHTML = `<h2>${title}</h2><p>${content}</p>`;
    }

    // Placeholder for loading data from JSON files
    async function loadData(filename) {
        try {
            const response = await fetch(`./data/${filename}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}.json`);
            }
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // Example of how we might load and display taxonomy later
    async function displayTaxonomy() {
        const taxonomy = await loadData('taxonomy');
        if (taxonomy) {
            let html = '<h3>Canonical Math Taxonomy</h3>';
            for (const level1 of taxonomy.majorBranches) {
                html += `<h4>${level1.name}</h4>`;
                if (level1.subBranches) {
                    for (const level2 of level1.subBranches) {
                        html += `<h5>${level2.name}</h5>`;
                        if (level2.specialties) {
                            html += `<ul>`;
                            for (const specialty of level2.specialties) {
                                html += `<li>${specialty.name}</li>`;
                            }
                            html += `</ul>`;
                        }
                    }
                }
            }
            appContainer.innerHTML = html;
        } else {
            appContainer.innerHTML = '<h2>Taxonomy not available.</h2>';
        }
    }

    // Initial content for the homepage
    renderContent(
        'Welcome to Math University!',
        'This platform provides an accreditable-style curriculum system, structured like a real university, expanding into a complete specialty library. Use the navigation to explore degree tracks, the canonical math taxonomy, and our extensive course library.'
    );

    // Example: You could add event listeners to navigation links to call functions like displayTaxonomy()
    // document.querySelector('nav a[href="#taxonomy"]').addEventListener('click', displayTaxonomy);
});
