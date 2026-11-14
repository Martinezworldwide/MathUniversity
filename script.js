document.addEventListener('DOMContentLoaded', async () => {
    const appContainer = document.getElementById('app-container');
    const nav = document.querySelector('nav');

    let coursesCache = null;

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

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

    async function loadCourses() {
        if (!coursesCache) {
            coursesCache = await loadData('courses');
        }
        return coursesCache;
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
            html += `<h3>${esc(level1Name)}</h3>`;
            const level1Branch = level1Branches[level1Name];

            // Check for Level 2 sub-branches
            if (level1Branch["Level 2"]) {
                const level2Branches = level1Branch["Level 2"];
                Object.keys(level2Branches).forEach(level2Name => {
                    html += `<h4>${esc(level2Name)}</h4>`;
                    const level2Branch = level2Branches[level2Name];

                    // Check for Level 3 specialties
                    if (level2Branch["Level 3"] && Array.isArray(level2Branch["Level 3"])) {
                        html += `<ul>`;
                        level2Branch["Level 3"].forEach(specialty => {
                            html += `<li>${esc(specialty)}</li>`;
                        });
                        html += `</ul>`;
                    }
                });
            }
        });

        html += `<h3>Rules for Expansion</h3>`;
        if (taxonomy.taxonomy_rules) {
            html += `<p>${esc(taxonomy.taxonomy_rules)}</p>`;
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
                    <h3>${esc(track.title || 'Untitled Track')} (${esc(track.track_id)})</h3>
                    <p><strong>Total Credits:</strong> ${esc(track.total_credits || 'Not yet defined')}</p>
                    <h4>Required Courses</h4>
                    <ul>`;
            if (track.required_courses && track.required_courses.length > 0) {
                track.required_courses.forEach(courseId => {
                    html += `<li><a href="#courses" class="course-link" data-course="${esc(courseId)}">${esc(courseId)}</a></li>`;
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
                    html += `<li><strong>${esc(groupName)}:</strong> ${esc(group.description)}</li>`;
                });
                html += `</ul>`;
            }

            html += `
                    <h4>Capstone</h4>
                    <p><strong>Course:</strong> ${esc(track.capstone ? track.capstone.course_id : 'Not yet defined')}</p>
                    <p><strong>Title:</strong> ${esc(track.capstone ? track.capstone.title : 'Not yet defined')}</p>
                    <p>${esc(track.capstone ? track.capstone.description : 'Not yet defined')}</p>
                    <h4>Mastery Exam</h4>
                    <p><strong>Format:</strong> ${esc(track.mastery_exam ? track.mastery_exam.format : 'Not yet defined')}</p>
                    <p>${esc(track.mastery_exam ? track.mastery_exam.description : 'Not yet defined')}</p>
                </div>
            `;
        });

        appContainer.innerHTML = html;
        appContainer.querySelectorAll('.course-link').forEach(link => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                await showCourses(link.getAttribute('data-course'));
            });
        });
    }

    // Render Courses
    function courseCard(course) {
        const prereqs = Array.isArray(course.prerequisites) ? course.prerequisites : [];
        const prereqHtml = prereqs.length
            ? prereqs.map(id => `<a href="#courses" class="course-link prereq-chip" data-course="${esc(id)}">${esc(id)}</a>`).join(' ')
            : '<span>None</span>';

        let modulesHtml = '';
        if (Array.isArray(course.modules) && course.modules.length) {
            modulesHtml = `<h5>Modules</h5>` + course.modules.map(mod => {
                const lessons = Array.isArray(mod.lessons) && mod.lessons.length
                    ? `<ul>${mod.lessons.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`
                    : '';
                return `<div class="course-module"><strong>${esc(mod.module_title)}</strong>${lessons}</div>`;
            }).join('');
        }

        let assessHtml = '';
        if (course.assessments) {
            const a = course.assessments;
            const parts = [];
            if (a.quizzes) parts.push(`${a.quizzes} quizzes`);
            if (a.midterm) parts.push('midterm');
            if (a.final) parts.push('final exam');
            if (a.project) parts.push('project');
            if (parts.length) assessHtml = `<p><strong>Assessments:</strong> ${esc(parts.join(' · '))}</p>`;
        }

        return `
            <details class="course-card" id="course-${esc(course.course_id)}" data-course-id="${esc(course.course_id)}" data-level="${esc(course.level)}" data-search="${esc((course.course_id + ' ' + (course.title || '') + ' ' + (course.description || '')).toLowerCase())}">
                <summary>
                    <span class="course-id">${esc(course.course_id)}</span>
                    <span class="course-title">${esc(course.title || 'Untitled Course')}</span>
                    <span class="course-meta">Level ${esc(course.level || '?')} · ${esc(course.credit_hours || '?')} credits</span>
                </summary>
                <div class="course-body">
                    <p>${esc(course.description || '')}</p>
                    <p><strong>Prerequisites:</strong> ${prereqHtml}</p>
                    ${modulesHtml}
                    ${assessHtml}
                    ${course.mastery_rubric ? `<p><strong>Mastery:</strong> ${esc(course.mastery_rubric)}</p>` : ''}
                </div>
            </details>`;
    }

    function renderCourses(courses, openCourseId) {
        if (!courses) {
            appContainer.innerHTML = `<h2>Course Library</h2><p>Course data not available or empty.</p>`;
            return;
        }
        const list = Object.values(courses).sort((a, b) =>
            String(a.course_id).localeCompare(String(b.course_id), undefined, { numeric: true }));
        const levels = [...new Set(list.map(c => c.level).filter(Boolean))].sort((a, b) => a - b);

        appContainer.innerHTML = `
            <h2>Course Library</h2>
            <p><strong id="course-count">${list.length} courses</strong> — click a course to see its modules, lessons, prerequisites, and mastery rubric.</p>
            <div class="course-controls">
                <input type="search" id="course-search" placeholder="Search by code, title, or keyword…" aria-label="Search courses">
                <select id="course-level" aria-label="Filter by level">
                    <option value="">All levels</option>
                    ${levels.map(l => `<option value="${esc(l)}">${esc(l)}-level</option>`).join('')}
                </select>
            </div>
            <div id="course-list">${list.map(courseCard).join('')}</div>
            <p id="course-none" hidden>No courses match that search.</p>`;

        const searchEl = document.getElementById('course-search');
        const levelEl = document.getElementById('course-level');
        const countEl = document.getElementById('course-count');
        const noneEl = document.getElementById('course-none');

        function applyFilter() {
            const q = searchEl.value.trim().toLowerCase();
            const lvl = levelEl.value;
            let visible = 0;
            appContainer.querySelectorAll('.course-card').forEach(card => {
                const match = (!q || card.getAttribute('data-search').includes(q)) &&
                              (!lvl || card.getAttribute('data-level') === lvl);
                card.hidden = !match;
                if (match) visible++;
            });
            countEl.textContent = `${visible} of ${list.length} courses`;
            noneEl.hidden = visible !== 0;
        }
        searchEl.addEventListener('input', applyFilter);
        levelEl.addEventListener('change', applyFilter);

        appContainer.querySelectorAll('.course-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                openCourse(link.getAttribute('data-course'));
            });
        });

        if (openCourseId) openCourse(openCourseId);
    }

    function openCourse(courseId) {
        const card = document.getElementById(`course-${courseId}`);
        if (!card) return;
        // Clear any active filter so the target is visible
        const searchEl = document.getElementById('course-search');
        const levelEl = document.getElementById('course-level');
        if (searchEl && (searchEl.value || levelEl.value)) {
            searchEl.value = '';
            levelEl.value = '';
            searchEl.dispatchEvent(new Event('input'));
        }
        card.open = true;
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function showCourses(openCourseId) {
        const courses = await loadCourses();
        renderCourses(courses, openCourseId);
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
        } else if (target === 'courses') {
            await showCourses();
        } else {
            // Default home view
            const courses = await loadCourses();
            const count = courses ? Object.keys(courses).length : null;
            appContainer.innerHTML = `<h2>Welcome to Math University!</h2>
                <p>This platform provides an accreditable-style curriculum system, structured like a real university, expanding into a complete specialty library. Use the navigation above to explore our curriculum.</p>
                <p>${count ? `Browse the full <a href="#courses" id="home-courses-link"><strong>Course Library — ${count} courses</strong></a>, the canonical taxonomy, and our degree tracks.` : 'Select an option above to view data.'}</p>
                `;
            const homeLink = document.getElementById('home-courses-link');
            if (homeLink) {
                homeLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await showCourses();
                });
            }
        }
    }

    // Build navigation dynamically
    function buildNavigation() {
        nav.innerHTML = `
            <a href="#home" data-target="home">Curriculum Home</a>
            <a href="#taxonomy" data-target="taxonomy">Taxonomy</a>
            <a href="#tracks" data-target="tracks">Degree Tracks</a>
            <a href="#courses" data-target="courses">Courses</a>
        `;
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', handleNavigation);
        });
    }

    // Initial load — honour #courses / #taxonomy / #tracks deep links
    buildNavigation();
    const initial = (location.hash || '').replace('#', '');
    if (initial === 'courses' || initial === 'taxonomy' || initial === 'tracks') {
        handleNavigation({ preventDefault: () => {}, target: { getAttribute: () => initial } });
    } else {
        handleNavigation({ preventDefault: () => {}, target: { getAttribute: () => 'home' } });
    }
});
