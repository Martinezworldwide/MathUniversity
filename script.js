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

    async function loadData(filename) {
        try {
            const response = await fetch(`./data/${filename}.json`);
            if (!response.ok) throw new Error(`Failed to load ${filename}.json`);
            return await response.json();
        } catch (error) {
            console.error(`Error loading ${filename}.json:`, error);
            return null;
        }
    }

    async function loadCourses() {
        if (!coursesCache) coursesCache = await loadData('courses');
        return coursesCache;
    }

    function setActive(target) {
        nav.querySelectorAll('a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('data-target') === target);
        });
    }

    // ---- Taxonomy ----
    function renderTaxonomy(taxonomy) {
        let html = `<h2>Canonical Math Taxonomy</h2><p class="section-intro">12 major branches, each with sub-branches and specialties.</p>`;
        if (!taxonomy || !taxonomy.levels || !taxonomy.levels["Level 1"]) {
            appContainer.innerHTML = html + `<div class="panel"><p>Taxonomy data not available or empty.</p></div>`;
            return;
        }
        const level1Branches = taxonomy.levels["Level 1"];
        Object.keys(level1Branches).forEach(level1Name => {
            html += `<div class="panel"><h3>${esc(level1Name)}</h3>`;
            const level1Branch = level1Branches[level1Name];
            if (level1Branch["Level 2"]) {
                Object.keys(level1Branch["Level 2"]).forEach(level2Name => {
                    const level2Branch = level1Branch["Level 2"][level2Name];
                    html += `<h4>${esc(level2Name)}</h4>`;
                    if (level2Branch["Level 3"] && Array.isArray(level2Branch["Level 3"])) {
                        html += `<ul>${level2Branch["Level 3"].map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
                    }
                });
            }
            html += `</div>`;
        });
        html += `<div class="panel"><h3>Rules for Expansion</h3><p>${esc(taxonomy.taxonomy_rules || 'No expansion rules defined.')}</p></div>`;
        appContainer.innerHTML = html;
    }

    // ---- Degree Tracks ----
    function renderDegreeTracks(tracks) {
        let html = `<h2>Degree Tracks</h2>`;
        if (!tracks) {
            appContainer.innerHTML = html + `<div class="panel"><p>Degree track data not available or empty.</p></div>`;
            return;
        }
        Object.values(tracks).forEach(track => {
            html += `<div class="panel degree-track">
                <h3>${esc(track.title || 'Untitled Track')} (${esc(track.track_id)})</h3>
                <p><strong>Total Credits:</strong> ${esc(track.total_credits || 'Not yet defined')}</p>
                <h4>Required Courses — tap one to open it in the library</h4><ul>`;
            if (track.required_courses && track.required_courses.length) {
                track.required_courses.forEach(courseId => {
                    html += `<li><a href="#courses" class="course-link" data-course="${esc(courseId)}">${esc(courseId)}</a></li>`;
                });
            } else {
                html += `<li>No required courses defined yet.</li>`;
            }
            html += `</ul>`;
            if (track.elective_groups) {
                html += `<h4>Elective Groups</h4><ul>`;
                Object.keys(track.elective_groups).forEach(groupName => {
                    const group = track.elective_groups[groupName];
                    html += `<li><strong>${esc(groupName)}:</strong> ${esc(group.description)}</li>`;
                });
                html += `</ul>`;
            }
            html += `<h4>Capstone</h4>
                <p><strong>Course:</strong> ${esc(track.capstone ? track.capstone.course_id : 'Not yet defined')}</p>
                <p><strong>Title:</strong> ${esc(track.capstone ? track.capstone.title : 'Not yet defined')}</p>
                <p>${esc(track.capstone ? track.capstone.description : '')}</p>
                <h4>Mastery Exam</h4>
                <p><strong>Format:</strong> ${esc(track.mastery_exam ? track.mastery_exam.format : 'Not yet defined')}</p>
                <p>${esc(track.mastery_exam ? track.mastery_exam.description : '')}</p>
            </div>`;
        });
        appContainer.innerHTML = html;
        appContainer.querySelectorAll('.course-link').forEach(link => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                await showCourses(link.getAttribute('data-course'));
            });
        });
    }

    // ---- Courses ----
    function courseCard(course) {
        const prereqs = Array.isArray(course.prerequisites) ? course.prerequisites : [];
        const prereqHtml = prereqs.length
            ? prereqs.map(id => `<a href="#courses" class="course-link prereq-chip" data-course="${esc(id)}">${esc(id)}</a>`).join(' ')
            : '<span>None — start here</span>';

        let modulesHtml = '';
        if (Array.isArray(course.modules) && course.modules.length) {
            modulesHtml = course.modules.map(mod => {
                const lessons = Array.isArray(mod.lessons) && mod.lessons.length
                    ? `<ul>${mod.lessons.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : '';
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
        <article class="course-card" id="course-${esc(course.course_id)}" data-course-id="${esc(course.course_id)}" data-level="${esc(course.level)}" data-search="${esc((course.course_id + ' ' + (course.title || '') + ' ' + (course.description || '')).toLowerCase())}">
            <div class="course-top">
                <span class="course-id">${esc(course.course_id)}</span>
                <span class="level-badge level-${esc(course.level)}">${esc(course.level)}-level</span>
                <span class="course-credits">${esc(course.credit_hours || '?')} credits</span>
            </div>
            <h3 class="course-title">${esc(course.title || 'Untitled Course')}</h3>
            <p class="course-desc">${esc(course.description || '')}</p>
            <p class="course-prereqs"><strong>Prerequisites:</strong> ${prereqHtml}</p>
            ${modulesHtml ? `<details class="course-details"><summary>Modules &amp; lessons (${course.modules.length})</summary>${modulesHtml}${assessHtml}</details>` : assessHtml}
            ${course.mastery_rubric ? `<p class="mastery"><strong>Mastery:</strong> ${esc(course.mastery_rubric)}</p>` : ''}
        </article>`;
    }

    function renderCourses(courses, openCourseId) {
        if (!courses) {
            appContainer.innerHTML = `<h2>Course Library</h2><div class="panel"><p>Course data could not be loaded. Check your connection and refresh.</p></div>`;
            return;
        }
        const list = Object.values(courses).sort((a, b) =>
            String(a.course_id).localeCompare(String(b.course_id), undefined, { numeric: true }));
        const levels = [...new Set(list.map(c => c.level).filter(Boolean))].sort((a, b) => a - b);

        appContainer.innerHTML = `
            <h2>Course Library</h2>
            <p class="section-intro"><strong id="course-count">${list.length} courses</strong> — every course is shown below. Tap “Modules &amp; lessons” on a card for the full syllabus.</p>
            <div class="course-controls">
                <input type="search" id="course-search" placeholder="Search courses — try “calculus”, “algebra”, “statistics”…" aria-label="Search courses">
                <select id="course-level" aria-label="Filter by level">
                    <option value="">All levels</option>
                    ${levels.map(l => `<option value="${esc(l)}">${esc(l)}-level</option>`).join('')}
                </select>
            </div>
            <div class="course-grid" id="course-list">${list.map(courseCard).join('')}</div>
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
        const searchEl = document.getElementById('course-search');
        const levelEl = document.getElementById('course-level');
        if (searchEl && (searchEl.value || levelEl.value)) {
            searchEl.value = '';
            levelEl.value = '';
            searchEl.dispatchEvent(new Event('input'));
        }
        const details = card.querySelector('details');
        if (details) details.open = true;
        card.classList.add('open-highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function showCourses(openCourseId) {
        setActive('courses');
        const courses = await loadCourses();
        renderCourses(courses, openCourseId);
    }

    function renderAbout() {
        appContainer.innerHTML = `
            <h2>About Math University</h2>
            <div class="panel">
                <p>This platform provides an accreditable-style curriculum system, structured like a real university: a canonical math taxonomy, a 120-credit BS in Mathematics degree track with a senior capstone and mastery exam, and a full course library with modules, lessons, assessments, and mastery rubrics for every course.</p>
                <p>Start with the <a href="#courses" id="about-courses-link"><strong>Course Library</strong></a> — Calculus I (MATH101) has no prerequisites.</p>
            </div>`;
        const link = document.getElementById('about-courses-link');
        if (link) link.addEventListener('click', async (e) => { e.preventDefault(); await showCourses(); });
    }

    async function handleNavigation(event) {
        event.preventDefault();
        const target = event.target.getAttribute('data-target');
        if (target === 'taxonomy') {
            setActive('taxonomy');
            renderTaxonomy(await loadData('subjects'));
        } else if (target === 'tracks') {
            setActive('tracks');
            renderDegreeTracks(await loadData('tracks'));
        } else if (target === 'about') {
            setActive('about');
            renderAbout();
        } else {
            await showCourses();
        }
    }

    function buildNavigation() {
        nav.innerHTML = `
            <a href="#courses" data-target="courses">Courses</a>
            <a href="#tracks" data-target="tracks">Degree Tracks</a>
            <a href="#taxonomy" data-target="taxonomy">Taxonomy</a>
            <a href="#about" data-target="about">About</a>
        `;
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', handleNavigation);
        });
    }

    // Initial load: Courses are the landing view, so the library is visible
    // immediately with no tap required. #tracks / #taxonomy / #about deep-link.
    buildNavigation();
    const initial = (location.hash || '').replace('#', '');
    if (initial === 'taxonomy' || initial === 'tracks' || initial === 'about') {
        handleNavigation({ preventDefault: () => {}, target: { getAttribute: () => initial } });
    } else {
        showCourses();
    }
});
