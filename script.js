document.addEventListener('DOMContentLoaded', async () => {
    const appContainer = document.getElementById('app-container');
    const nav = document.querySelector('nav');

    // Helper function to load JSON data
    async function loadData(filename) {
        try {
            const response = await fetch(`./data/${filename}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}.json`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading ${filename}.json:`, error);
            return null;
        }
    }

    // Render Taxonomy
    function renderTaxonomy(taxonomy) {
        let html = `<h2>Canonical Math Taxonomy</h2>`;
        if (!taxonomy || !taxonomy.levels || !taxonomy.levels["Level 1"]) {
            html += `<p>Taxonomy data not available or empty.</p>`;
            appContainer.innerHTML = html;
            return;
        }

        const level1Branches = taxonomy.levels["Level 1"];
        
        // Iterate through Level 1 branches (major branches)
        Object.keys(level1Branches).forEach(level1Name => {
            html += `<h3>${level1Name}</h3>`;
            const level1Branch = level1Branches[level1Name];
            
            // Check for Level 2 sub-branches
            if (level1Branch["Level 2"]) {
                const level2Branches = level1Branch["Level 2"];
                Object.keys(level2Branches).forEach(level2Name => {
                    html += `<h4>${level2Name}</h4>`;
                    const level2Branch = level2Branches[level2Name];
                    
                    // Check for Level 3 specialties
                    if (level2Branch["Level 3"] && Array.isArray(level2Branch["Level 3"])) {
                        html += `<ul>`;
                        level2Branch["Level 3"].forEach(specialty => {
                            html += `<li>${specialty}</li>`;
                        });
                        html += `</ul>`;
                    }
                });
            }
        });

        html += `<h3>Rules for Expansion</h3>`;
        if (taxonomy.taxonomy_rules) {
            html += `<p>${taxonomy.taxonomy_rules}</p>`;
        } else {
            html += `<p>No expansion rules defined.</p>`;
        }

        appContainer.innerHTML = html;
    }

    // Render Degree Tracks
    function renderDegreeTracks(tracks) {
        let html = `<h2>Degree Tracks</h2>`;
        if (!tracks) {
            html += `<p>Degree track data not available or empty.</p>`;
            appContainer.innerHTML = html;
            return;
        }

        // Convert tracks object to array
        const tracksArray = Object.values(tracks);
        
        tracksArray.forEach(track => {
            html += `
                <div class="degree-track">
                    <h3>${track.title} (${track.track_id})</h3>
                    <p><strong>Total Credits:</strong> ${track.total_credits || 'Not yet defined'}</p>
                    <h4>Required Courses</h4>
                    <ul>`;
            if (track.required_courses && track.required_courses.length > 0) {
                track.required_courses.forEach(courseId => {
                    html += `<li>${courseId}</li>`; // Will link to full course details later
                });
            } else {
                html += `<li>No required courses defined yet.</li>`;
            }
            html += `</ul>`;

            if (track.elective_groups) {
                html += `<h4>Elective Groups</h4><ul>`;
                // elective_groups is an object, not an array
                Object.keys(track.elective_groups).forEach(groupName => {
                    const group = track.elective_groups[groupName];
                    html += `<li><strong>${groupName}:</strong> ${group.description}</li>`;
                });
                html += `</ul>`;
            }

            html += `
                    <h4>Capstone</h4>
                    <p><strong>Course:</strong> ${track.capstone ? track.capstone.course_id : 'Not yet defined'}</p>
                    <p><strong>Title:</strong> ${track.capstone ? track.capstone.title : ''}</p>
                    <p>${track.capstone ? track.capstone.description : ''}</p>
                    <h4>Mastery Exam</h4>
                    <p><strong>Format:</strong> ${track.mastery_exam ? track.mastery_exam.format : 'Not yet defined'}</p>
                    <p>${track.mastery_exam ? track.mastery_exam.description : ''}</p>
                </div>
            `;
        });

        appContainer.innerHTML = html;
    }

    // Navigation handler
    async function handleNavigation(event) {
        event.preventDefault();
        const target = event.target.getAttribute('data-target');
        if (target === 'taxonomy') {
            const taxonomy = await loadData('subjects');
            renderTaxonomy(taxonomy);
        } else if (target === 'tracks') {
            const tracks = await loadData('tracks');
            renderDegreeTracks(tracks);
        } else {
            // Default home view
            appContainer.innerHTML = `<h2>Welcome to Math University!</h2>
                <p>This platform provides an accreditable-style curriculum system, structured like a real university, expanding into a complete specialty library. Use the navigation below to explore our curriculum.</p>
                <p>Select an option above to view data.</p>
                `;
        }
    }

    // Build navigation dynamically
    function buildNavigation() {
        nav.innerHTML = `
            <a href="#home" data-target="home">Curriculum Home</a>
            <a href="#taxonomy" data-target="taxonomy">Taxonomy</a>
            <a href="#tracks" data-target="tracks">Degree Tracks</a>
        `;
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', handleNavigation);
        });
    }

    // Initial load
    buildNavigation();
    handleNavigation({ preventDefault: () => {}, target: { getAttribute: () => 'home' }}); // Load home view initially

    // Example of initial rendering on load (optional, can be replaced by default view)
    // const initialTaxonomy = await loadData('taxonomy');
    // if (initialTaxonomy) {
    //     renderTaxonomy(initialTaxonomy);
    // } else {
    //     const initialTracks = await loadData('tracks');
    //     if (initialTracks) renderDegreeTracks(initialTracks);
    // }

});
