// Audio cache to manage multiple sounds without creating new objects constantly
const audioCache = {};

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
    
    // Stop all playing sounds when navigating
    stopAllSounds();

    // Randomize positions saat masuk ke halaman hewan
    const animalPages = ['halaman-darat', 'halaman-laut', 'halaman-udara'];
    if (animalPages.includes(pageId)) {
        // Tunggu sebentar agar halaman sudah visible dan punya dimensi
        setTimeout(() => randomizeAnimalPositions(pageId), 60);
    }
}

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

    // Sesuaikan dengan ukuran gambar 190px + label ~32px
    const ITEM_W = 210;
    const ITEM_H = 240;

    // Shuffle agar urutan visual juga acak tiap kunjungan
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    if (pageId === 'halaman-darat') {
        // Bagi lebar menjadi zona per hewan agar tidak saling tumpuk
        const count = items.length;
        const zoneW = W / count;

        items.forEach((item, i) => {
            const minLeft = i * zoneW + 10;
            const maxLeft = Math.min((i + 1) * zoneW - ITEM_W - 10, W - ITEM_W - 10);
            const left    = minLeft + Math.random() * Math.max(0, maxLeft - minLeft);

            // bottom: 60-150px → hewan jelas berdiri di atas tanah, tidak terpotong
            const bottom  = 60 + Math.random() * 90;

            item.style.left   = left + 'px';
            item.style.bottom = bottom + 'px';
            item.style.top    = '';
        });

    } else {
        // Udara & Laut → bebas acak dengan anti-overlap
        const TOP_SAFE = 110;   // hindari logo & tombol
        const GAP      = 25;    // jarak minimum antar hewan
        const placed   = [];

        items.forEach(item => {
            let pos = null;

            // Coba sampai 150x untuk menemukan posisi yang tidak tumpang tindih
            for (let attempt = 0; attempt < 150; attempt++) {
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

            // Fallback jika benar-benar tidak ada ruang (sangat jarang)
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
