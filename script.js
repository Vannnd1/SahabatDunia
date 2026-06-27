// Audio cache to manage multiple sounds without creating new objects constantly
const audioCache = {};

// ─── Backsound ────────────────────────────────────────────────────
let backsoundReady = false;

function initBacksound() {
    const bs = document.getElementById('backsound');
    if (!bs) return;
    bs.volume = 0.6; // volume default 60%

    // Autoplay dibatasi browser → play saat user pertama kali klik
    const unlockAudio = () => {
        if (!backsoundReady) {
            bs.play().catch(() => {});
            backsoundReady = true;
        }
        document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
}

function handleBacksound(pageId) {
    const bs = document.getElementById('backsound');
    const widget = document.getElementById('sound-widget');
    if (!bs || !widget) return;

    const targetPage = document.getElementById(pageId);
    const needsBGM = targetPage && targetPage.dataset.backsound === 'true';

    if (needsBGM) {
        widget.classList.remove('hidden');
        if (backsoundReady && !bs.muted) {
            bs.play().catch(() => {});
        }
    } else {
        widget.classList.add('hidden');
        bs.pause();
    }
}

function toggleMute() {
    const bs = document.getElementById('backsound');
    const icon = document.getElementById('sound-icon');
    if (!bs) return;

    bs.muted = !bs.muted;
    if (bs.muted) {
        icon.textContent = '🔇';
        bs.pause();
    } else {
        icon.textContent = '🔊';
        bs.play().catch(() => {});
    }
}

function setVolume(val) {
    const bs = document.getElementById('backsound');
    const icon = document.getElementById('sound-icon');
    const slider = document.getElementById('volume-slider');
    if (!bs) return;

    const volume = val / 100;
    bs.volume = volume;

    // Update visual fill slider
    if (slider) slider.style.background =
        `linear-gradient(to right, #FF8C00 ${val}%, rgba(255,255,255,0.5) ${val}%)`;

    if (volume === 0) {
        bs.muted = true;
        icon.textContent = '🔇';
    } else {
        bs.muted = false;
        icon.textContent = '🔊';
        if (backsoundReady) bs.play().catch(() => {});
    }
}
// ──────────────────────────────────────────────────────────────────

function goToPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Stop all animal sounds when navigating
    stopAllSounds();

    // Handle backsound play/pause sesuai halaman
    handleBacksound(pageId);

    // Randomize positions saat masuk ke halaman hewan
    const animalPages = ['halaman-darat', 'halaman-laut', 'halaman-udara'];
    if (animalPages.includes(pageId)) {
        // Tunggu sebentar agar halaman sudah visible dan punya dimensi
        setTimeout(() => randomizeAnimalPositions(pageId), 60);
    }
}

// Init saat halaman pertama dimuat
window.addEventListener('DOMContentLoaded', () => {
    initBacksound();
    // Landing page aktif pertama, tampilkan widget
    handleBacksound('halaman-awal');
});

// Hitung ulang posisi hewan saat orientasi layar berubah (portrait ↔ landscape)
function recalcActiveAnimalPage() {
    const animalPages = ['halaman-darat', 'halaman-laut', 'halaman-udara'];
    for (const pageId of animalPages) {
        const page = document.getElementById(pageId);
        if (page && page.classList.contains('active')) {
            randomizeAnimalPositions(pageId);
            break;
        }
    }
}

window.addEventListener('orientationchange', () => {
    // Tunggu browser selesai mengubah dimensi layar
    setTimeout(recalcActiveAnimalPage, 300);
});

window.addEventListener('resize', () => {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(recalcActiveAnimalPage, 250);
});

/**
 * Randomize posisi hewan:
 * - Darat  : zona horizontal → hewan di bagian bawah, tidak terpotong
 * - Udara / Laut : bebas acak dengan anti-overlap
 */
function randomizeAnimalPositions(pageId) {
    const page = document.getElementById(pageId);
    if (!page) return;

    const container = page.querySelector('.animal-container');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.animal-item'));
    const W = container.offsetWidth;
    const H = container.offsetHeight;

    // Ukuran item disesuaikan dengan breakpoint layar & orientasi
    let ITEM_W, ITEM_H;
    const isLandscape = window.innerWidth > window.innerHeight;
    const shortHeight = window.innerHeight <= 500; // HP landscape

    if (isLandscape && shortHeight) {
        // HP landscape: gambar 110px
        ITEM_W = 130;
        ITEM_H = 150;
    } else if (isLandscape && window.innerHeight <= 768) {
        // Tablet landscape: gambar 150px
        ITEM_W = 170;
        ITEM_H = 195;
    } else if (window.innerWidth <= 480) {
        // Mobile portrait: gambar 120px
        ITEM_W = 140;
        ITEM_H = 165;
    } else if (window.innerWidth <= 768) {
        // Tablet portrait: gambar 180px
        ITEM_W = 200;
        ITEM_H = 220;
    } else {
        // Desktop: gambar 270px
        ITEM_W = 300;
        ITEM_H = 320;
    }

    // Shuffle agar urutan visual juga acak tiap kunjungan
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    if (pageId === 'halaman-darat') {
        const count = items.length; // 6 hewan

        // Mobile/Tablet portrait → grid 2 KOLOM × 3 BARIS
        // (cellW = (W-PAD*2)/2 ≈ 179px > ITEM_W 140px → tidak terpotong)
        if (!isLandscape && window.innerWidth <= 768) {
            const COLS     = 2;
            const PAD      = 12;
            const TOP_SAFE = 90;   // hindari logo & tombol atas

            const cellW = (W - PAD * 2) / COLS;            // ~179px di mobile
            const usableH = H - TOP_SAFE - 10;
            const cellH = usableH / 3;                     // 3 baris

            items.forEach((item, i) => {
                const col = i % COLS;
                const row = Math.floor(i / COLS);

                // Posisi horizontal: tengah-tengahkan item di dalam cell
                const cellLeft = PAD + col * cellW;
                const left = cellLeft + (cellW - ITEM_W) / 2;

                // Posisi vertikal: tengah cell + sedikit acak
                const cellTop = TOP_SAFE + row * cellH;
                const top = cellTop + (cellH - ITEM_H) / 2 + (Math.random() - 0.5) * 20;

                item.style.left   = Math.max(PAD, Math.min(W - ITEM_W - PAD, left)) + 'px';
                item.style.top    = Math.max(TOP_SAFE, top) + 'px';
                item.style.bottom = '';
            });

        } else {
            // Desktop / landscape → 1 baris di bawah
            const zoneW = W / count;

            items.forEach((item, i) => {
                const minLeft = i * zoneW + 10;
                const maxLeft = Math.min((i + 1) * zoneW - ITEM_W - 10, W - ITEM_W - 10);
                const left    = minLeft + Math.random() * Math.max(0, maxLeft - minLeft);
                const bottom  = 60 + Math.random() * 90;

                item.style.left   = left + 'px';
                item.style.bottom = bottom + 'px';
                item.style.top    = '';
            });
        }

    } else if (pageId === 'halaman-udara') {
        // Udara punya 6 hewan → grid zona 2 baris × 3 kolom agar tidak pernah overlap
        const COLS     = 3;
        const ROWS     = 2;
        const TOP_SAFE = 110;
        const cellW    = (W - 20) / COLS;
        const cellH    = (H - TOP_SAFE - 10) / ROWS;
        const PAD      = 15; // padding dalam sel supaya tidak mepet tepi

        items.forEach((item, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);

            // Rentang aman di dalam sel
            const minLeft = col * cellW + PAD;
            const maxLeft = Math.max(minLeft, col * cellW + cellW - ITEM_W - PAD);
            const minTop  = TOP_SAFE + row * cellH + PAD;
            const maxTop  = Math.max(minTop, TOP_SAFE + row * cellH + cellH - ITEM_H - PAD);

            const left = minLeft + Math.random() * Math.max(0, maxLeft - minLeft);
            const top  = minTop  + Math.random() * Math.max(0, maxTop  - minTop);

            item.style.left   = left + 'px';
            item.style.top    = top  + 'px';
            item.style.bottom = '';
        });

    } else {
        // Laut (3 hewan) → bebas acak dengan anti-overlap sudah cukup ruang
        const TOP_SAFE = 110;
        const GAP      = 25;
        const placed   = [];

        items.forEach(item => {
            let pos = null;

            for (let attempt = 0; attempt < 300; attempt++) {
                const left = 15 + Math.random() * (W - ITEM_W - 30);
                const top  = TOP_SAFE + Math.random() * (H - ITEM_H - TOP_SAFE - 15);

                const overlaps = placed.some(p =>
                    left < p.left + ITEM_W + GAP &&
                    left + ITEM_W + GAP > p.left &&
                    top  < p.top  + ITEM_H + GAP &&
                    top  + ITEM_H + GAP   > p.top
                );

                if (!overlaps) {
                    pos = { left, top };
                    break;
                }
            }

            if (!pos) {
                pos = {
                    left: 15 + Math.random() * (W - ITEM_W - 30),
                    top : TOP_SAFE + Math.random() * (H - ITEM_H - TOP_SAFE - 15)
                };
            }

            placed.push(pos);
            item.style.left   = pos.left + 'px';
            item.style.top    = pos.top  + 'px';
            item.style.bottom = '';
        });
    }
}

function playSound(soundFileName, category) {
    // Stop semua suara yang sedang bermain sebelum memulai suara baru
    stopAllSounds();

    // Determine the path based on category
    const path = `asset/sound/${category}/${soundFileName}`;
    
    // Check if audio exists in cache, if not create it
    if (!audioCache[path]) {
        audioCache[path] = new Audio(path);
    }
    
    const audio = audioCache[path];
    
    // Reset ke awal lalu play
    audio.currentTime = 0;
    
    // Play the audio
    audio.play().catch(error => {
        console.error("Error playing sound:", error);
    });
    
    // Add a simple animation effect to the clicked image
    const clickedElement = event.currentTarget.querySelector('img');
    if (clickedElement) {
        clickedElement.style.transform = 'scale(1.2) rotate(-10deg)';
        setTimeout(() => {
            clickedElement.style.transform = '';
        }, 300);
    }
}

function stopAllSounds() {
    for (const key in audioCache) {
        const audio = audioCache[key];
        audio.pause();
        audio.currentTime = 0;
    }
}
