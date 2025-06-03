document.addEventListener('DOMContentLoaded', function() {
    if (!('Notification' in window)) {
        alert('This browser does not support desktop notifications');
    } else {
        Notification.requestPermission();
    }

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const subjectForm = document.getElementById('subject-form');
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    subjectForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const subject = document.getElementById('subject').value;
        const day = document.getElementById('day').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const reminder = document.getElementById('reminder').value;

        const newSubject = {
            id: Date.now(),
            subject,
            day,
            startTime,
            endTime,
            reminder
        };

        subjects.push(newSubject);
        localStorage.setItem('subjects', JSON.stringify(subjects));
        subjectForm.reset();
        showNotification('Subject Added', `${subject} has been added.`);
        renderTimetable();
        document.querySelector('.tab[data-tab="view"]').click();
    });

    function renderTimetable() {
        const timetableBody = document.querySelector('#timetable-list tbody');
        const noSubjects = document.getElementById('no-subjects');
        const filterDay = document.getElementById('filter-day').value;
        timetableBody.innerHTML = '';

        let filteredSubjects = filterDay === 'all' ? subjects : subjects.filter(sub => sub.day === filterDay);
        filteredSubjects.sort((a, b) => {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const dayComparison = days.indexOf(a.day) - days.indexOf(b.day);
            return dayComparison === 0 ? a.startTime.localeCompare(b.startTime) : dayComparison;
        });

        if (filteredSubjects.length === 0) {
            noSubjects.style.display = 'block';
        } else {
            noSubjects.style.display = 'none';
            filteredSubjects.forEach(sub => {
                const row = document.createElement('tr');
                row.className = `subject-${sub.day.toLowerCase()}`;
                row.innerHTML = `
                    <td>${sub.day}</td>
                    <td>${sub.subject}</td>
                    <td>${formatTime(sub.startTime)} - ${formatTime(sub.endTime)}</td>
                    <td><button class="delete-btn" data-id="${sub.id}">Delete</button></td>
                `;
                timetableBody.appendChild(row);
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    deleteSubject(parseInt(this.dataset.id));
                });
            });
        }
    }

    function formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${minutes} ${ampm}`;
    }

    function deleteSubject(id) {
        subjects = subjects.filter(sub => sub.id !== id);
        localStorage.setItem('subjects', JSON.stringify(subjects));
        showNotification('Subject Deleted', 'Subject removed successfully.');
        renderTimetable();
    }

    document.getElementById('filter-day').addEventListener('change', renderTimetable);
    document.getElementById('clear-data').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all timetable data?')) {
            localStorage.removeItem('subjects');
            subjects = [];
            renderTimetable();
            showNotification('Data Cleared', 'All data removed.');
        }
    });

    document.getElementById('test-notification').addEventListener('click', function() {
        showNotification('Test Notification', 'This is a test.');
        if (Notification.permission === "granted" && document.getElementById('enable-notifications').checked) {
            new Notification('Test Notification', { body: 'This is a test.', icon: '/api/placeholder/64/64' });
        }
    });

    function showNotification(title, message) {
        const notification = document.getElementById('notification');
        notification.querySelector('.notification-title').textContent = title;
        notification.querySelector('.notification-message').textContent = message;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 5000);
    }

    function checkUpcomingClasses() {
        if (!document.getElementById('enable-notifications').checked) return;

        const now = new Date();
        const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

        subjects.forEach(sub => {
            if (sub.day === currentDay) {
                const [hours, minutes] = sub.startTime.split(':');
                const classTime = new Date();
                classTime.setHours(parseInt(hours));
                classTime.setMinutes(parseInt(minutes));
                classTime.setSeconds(0);

                const timeDiff = Math.round((classTime - now) / (1000 * 60));
                if (timeDiff > 0 && timeDiff <= parseInt(sub.reminder)) {
                    const message = `${sub.subject} starts in ${timeDiff} minutes!`;
                    showNotification('Upcoming Class', message);
                    if (Notification.permission === "granted") {
                        new Notification('Upcoming Class', { body: message, icon: '/api/placeholder/64/64' });
                    }
                }
            }
        });
    }

    renderTimetable();
    setInterval(checkUpcomingClasses, 60000);
    checkUpcomingClasses();
});