// main.js — общий для всех страниц
(function () {
    'use strict';

    // --- Пример локальной "базы" (расширяй) ---
    window.DATA = [
        { id: 'kapop-huntrix', title: 'Кейпоп-охотницы на демонов', type: 'movie', year: 2024, url: 'movie/kapop-huntrix.html', poster: 'img/poster1.jpg', description: 'С древних времён девушки...' },
        { id: 'fight-on-fight', title: 'Битва за битвой', type: 'movie', year: 2023, url: 'movie/fight-on-fight.html', poster: 'img/poster2.png', description: 'В молодости Боб Фергюсон...' },
        { id: 'stream', title: 'Поток', type: 'movie', year: 2022, url: 'movie/stream.html', poster: 'img/poster3.jpg', description: 'Происходит глобальное наводнение...' },
        { id: 'new1', title: 'Новинка 1', type: 'movie', year: 2025, url: 'movie/new1.html', poster: 'img/new1.jpg', description: 'Новинка' },
        { id: 'new2', title: 'Новинка 2', type: 'movie', year: 2025, url: 'movie/new2.html', poster: 'img/new2.jpg', description: 'Новинка' },
        { id: 'shrek', title: 'Шрек', type: 'movie', year: 2001, url: 'movie/shrek.html', poster: 'img/poster-shrek.jpg', description: 'Весёлое приключение' },
        { id: 'zveropolis', title: 'Зверополис', type: 'animation', year: 2016, url: 'movie/zveropolis.html', poster: '../img/poster-zootopia.jpg', description: 'В красивом многонациональном городе Зверополис молодой кролик Джуди Хоппс становится первым кроличьим полицейским' },
        // добавляй свои элементы сюда...
    ];

    // ----------------- Helpers -----------------
    function readJSON(key) {
        try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
    }
    function writeJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

    // users handling (demo)
    function readUsers() {
        try { return JSON.parse(localStorage.getItem('users') || '[]'); }
        catch (e) { return []; }
    }
    function saveUsers(list) {
        localStorage.setItem('users', JSON.stringify(list || []));
    }
    function getUserByEmail(email) {
        if (!email) return null;
        return readUsers().find(u => u.email === email) || null;
    }
    function saveUser(user) {
        if (!user || !user.email) return;
        const users = readUsers();
        const idx = users.findIndex(u => u.email === user.email);
        if (idx >= 0) users[idx] = user; else users.push(user);
        saveUsers(users);
    }
    function getCurrentEmail() { return localStorage.getItem('currentUser') || null; }

    // cryptographic hash (SHA-256) — returns hex string
    async function hashPassword(str) {
        if (window.crypto && crypto.subtle && crypto.subtle.digest) {
            const enc = new TextEncoder();
            const data = enc.encode(str);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // fallback (не безопасно, только для демо)
            return btoa(str);
        }
    }

    // ----------------- Sidebar -----------------
    function initSidebar() {
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        if (!hamburger || !sidebar || !overlay) return;
        function open() { sidebar.classList.add('open'); overlay.classList.add('show'); sidebar.setAttribute('aria-hidden', 'false'); }
        function close() { sidebar.classList.remove('open'); overlay.classList.remove('show'); sidebar.setAttribute('aria-hidden', 'true'); }
        hamburger.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
        overlay.addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }

    // ----------------- Slider -----------------
    function initSlider() {
        const slidesEl = document.getElementById('slides');
        if (!slidesEl) return;
        const slides = Array.from(slidesEl.children);
        const prev = document.getElementById('prev');
        const next = document.getElementById('next');
        const dotsEl = document.getElementById('dots');
        let idx = 0, timer = null, autoplay = true;

        function renderDots() {
            if (!dotsEl) return;
            dotsEl.innerHTML = '';
            slides.forEach((s, i) => {
                const d = document.createElement('div');
                d.className = 'dot' + (i === idx ? ' active' : '');
                d.addEventListener('click', () => goTo(i));
                dotsEl.appendChild(d);
            });
        }

        function goTo(i) {
            idx = (i + slides.length) % slides.length;
            slidesEl.style.transform = `translateX(-${idx * 100}%)`;
            renderDots(); resetTimer();
        }
        function nextSlide() { goTo(idx + 1); }
        function prevSlide() { goTo(idx - 1); }
        if (next) next.addEventListener('click', nextSlide);
        if (prev) prev.addEventListener('click', prevSlide);

        function resetTimer() { if (timer) clearInterval(timer); if (autoplay) timer = setInterval(nextSlide, 4500); }
        const sliderWrap = document.getElementById('slider');
        if (sliderWrap) {
            sliderWrap.addEventListener('mouseenter', () => { autoplay = false; if (timer) clearInterval(timer); });
            sliderWrap.addEventListener('mouseleave', () => { autoplay = true; resetTimer(); });
        }

        renderDots(); resetTimer();

        // keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        });
    }

    // ----------------- Click tracking -----------------
    function initClickTracking() {
        document.body.addEventListener('click', (e) => {
            const a = e.target.closest && e.target.closest('a');
            if (!a) return;
            const href = a.getAttribute('href') || '';
            const movie = window.DATA.find(item => item.url === href || item.url === href.replace(location.origin + '/', ''));
            if (movie) {
                const list = readJSON('continueWatching');
                const filtered = list.filter(x => x.id !== movie.id);
                filtered.unshift({ id: movie.id, title: movie.title, url: movie.url, poster: movie.poster, ts: Date.now(), progress: 0 });
                writeJSON('continueWatching', filtered.slice(0, 10));
            }
        });
    }

    // ----------------- Renderers -----------------
    function renderContinue() {
        const container = document.getElementById('continue-row');
        if (!container) return;
        container.innerHTML = '';
        const stored = readJSON('continueWatching');
        const items = stored.length ? stored : window.DATA.slice(0, 5).map(d => ({ id: d.id, title: d.title, url: d.url, poster: d.poster }));
        items.forEach(it => {
            const a = document.createElement('a');
            a.className = 'card';
            a.href = it.url || '#';
            a.innerHTML = `<div class="poster" style="background-image:url('${it.poster}')"></div>`;
            container.appendChild(a);
        });
    }

    function renderWishlist() {
        const container = document.getElementById('wishlist-row');
        if (!container) return;
        container.innerHTML = '';
        const list = readJSON('wishlist');
        if (list.length === 0) {
            window.DATA.slice(0, 4).forEach(d => {
                const a = document.createElement('a'); a.className = 'card'; a.href = d.url;
                a.innerHTML = `<div class="poster" style="background-image:url('${d.poster}')"></div>`;
                container.appendChild(a);
            });
            return;
        }
        list.forEach(id => {
            const d = window.DATA.find(x => x.id === id);
            if (d) {
                const a = document.createElement('a'); a.className = 'card'; a.href = d.url;
                a.innerHTML = `<div class="poster" style="background-image:url('${d.poster}')"></div>`;
                container.appendChild(a);
            }
        });
    }

    // ----------------- Search form -----------------
    function initSearchForm() {
        const form = document.getElementById('searchForm');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            const q = (form.querySelector('input[name="q"]') || {}).value || '';
            if (!q.trim()) {
                e.preventDefault();
                form.querySelector('input[name="q"]').focus();
            }
        });
    }

    // ----------------- Auth UI (header) -----------------
    function initAuthUI() {
        const authArea = document.getElementById('authArea');
        if (!authArea) return;
        const email = getCurrentEmail();
        authArea.innerHTML = ''; // очистим — будем рендерить

        if (!email) {
            const a = document.createElement('a');
            a.id = 'accountBtn';
            a.className = 'btn-login';
            a.href = 'auth.html';
            a.textContent = 'Войти';
            authArea.appendChild(a);
            return;
        }

        const user = getUserByEmail(email);
        const avatarUrl = (user && user.avatar) ? user.avatar : 'img/avatar-default.png';
        const accountA = document.createElement('a');
        accountA.id = 'accountBtn';
        accountA.className = 'btn-login avatar';
        accountA.href = 'profile.html';
        accountA.title = user && (user.nickname || user.email);
        accountA.innerHTML = `<img src="${avatarUrl}" alt="Аватар">`;
        authArea.appendChild(accountA);

        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.title = 'Выйти';
        logoutBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M16 17l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            // обновить UI
            initAuthUI();
            // optional: redirect to homepage
            location.href = 'index.html';
        });
        authArea.appendChild(logoutBtn);
    }

    // ----------------- Initialization -----------------
    document.addEventListener('DOMContentLoaded', () => {
        initSidebar();
        initSlider();
        initClickTracking();
        renderContinue();
        renderWishlist();
        initSearchForm();
        initAuthUI();
    });

    // expose small api for other pages (profile.html etc.)
    window._NF = {
        getUserByEmail,
        saveUser,
        hashPassword,
        getCurrentEmail,
        initAuthUI
    };

})(); // end IIFE

