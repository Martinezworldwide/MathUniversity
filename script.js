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
        if (!taxonomy || !taxonomy.majorBranches || taxonomy.majorBranches.length === 0) {
            html += `<p>Taxonomy data not available or empty.</p>`;
            appContainer.innerHTML = html;
            return;
        }

        taxonomy.majorBranches.forEach(level1 => {
            html += `<h3>${level1.name}</h3>`;
            if (level1.description) {
                html += `<p class="description">${level1.description}</p>`;
            }
            if (level1.subBranches && level1.subBranches.length > 0) {
                level1.subBranches.forEach(level2 => {
                    html += `<h4>${level2.name}</h4>`;
                    if (level2.description) {
                        html += `<p class="description">${level2.description}</p>`;
                    }
                    if (level2.specialties && level2.specialties.length > 0) {
                        html += `<ul>`;
                        level2.specialties.forEach(specialty => {
                            html += `<li>${specialty.name}</li>`;
                        });
                        html += `</ul>`;
                    }
                });
            }
        });

        html += `<h3>Rules for Expansion</h3><ul>`;
        if (taxonomy.rulesForExpansion && taxonomy.rulesForExpansion.length > 0) {
            taxonomy.rulesForExpansion.forEach(rule => {
                html += `<li>${rule}</li>`;
            });
        } else {
            html += `<li>No expansion rules defined.</li>`;
        }
        html += `</ul>`;

        appContainer.innerHTML = html;
    }

    // Render Degree Tracks
    function renderDegreeTracks(tracks) {
        let html = `<h2>Degree Tracks</h2>`;
        if (!tracks || !tracks.degreeTracks || tracks.degreeTracks.length === 0) {
            html += `<p>Degree track data not available or empty.</p>`;
            appContainer.innerHTML = html;
            return;
        }

        tracks.degreeTracks.forEach(track => {
            html += `
                <div class="degree-track">
                    <h3>${track.name} (${track.id})</h3>
                    <p class="description">${track.description}</p>
                    <p><strong>Total Credits:</strong> ${track.totalCredits || 'Not yet defined'}</p>
                    <h4>Required Courses</h4>
                    <ul>`;
            if (track.requiredCourses && track.requiredCourses.length > 0) {
                track.requiredCourses.forEach(courseId => {
                    html += `<li>${courseId}</li>`; // Will link to full course details later
                });
            } else {
                html += `<li>No required courses defined yet.</li>`;
            }
            html += `</ul>`;

            if (track.electiveGroups && track.electiveGroups.length > 0) {
                html += `<h4>Elective Groups</h4><ul>`;
                track.electiveGroups.forEach(group => {
                    html += `<li><strong>${group.name}:</strong> ${group.description} (${group.credits} credits)</li>`;
                });
                html += `</ul>`;
            }

            html += `
                    <h4>Prerequisites Overview</h4>
                    <p>${track.prerequisitesOverview || 'Not yet defined'}</p>
                    <h4>Capstone</h4>
                    <p><strong>Type:</strong> ${track.capstone ? track.capstone.type : 'Not yet defined'}</p>
                    <p>${track.capstone ? track.capstone.description : ''}</p>
                    <h4>Mastery Exam</h4>
                    <p><strong>Format:</strong> ${track.masteryExam ? track.masteryExam.format : 'Not yet defined'}</p>
                    <p><strong>Topics:</strong> ${track.masteryExam ? track.masteryExam.topics : ''}</p>
                    <p><strong>Pass Criteria:</strong> ${track.masteryExam ? track.masteryExam.passCriteria : ''}</p>
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
            const taxonomy = await loadData('taxonomy');
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
