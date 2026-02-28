// ===================================
// Application State
// ===================================
const AppState = {
    currentView: 'floorplan',
    viewer360: null,
    camera: null,
    scene: null,
    renderer: null,
    controls: null,
    isLoading: true,
    texture: null
};

// ===================================
// DOM Elements
// ===================================
const DOM = {
    loadingScreen: null,
    loadingProgress: null,
    floorplanView: null,
    viewer360View: null,
    roomHotspot: null,
    backButton: null,
    zoomInButton: null,
    zoomOutButton: null,
    fullscreenButton: null,
    canvasContainer: null,
    instructionsOverlay: null,
    closeInstructions: null
};

// ===================================
// Initialize Application
// ===================================
function initApp() {
    // Cache DOM elements
    DOM.loadingScreen = document.getElementById('loading-screen');
    DOM.loadingProgress = document.getElementById('loading-progress');
    DOM.floorplanView = document.getElementById('floorplan-view');
    DOM.viewer360View = document.getElementById('viewer-360');
    DOM.roomHotspot = document.getElementById('room-hotspot');
    DOM.backButton = document.getElementById('back-button');
    DOM.zoomInButton = document.getElementById('zoom-in');
    DOM.zoomOutButton = document.getElementById('zoom-out');
    DOM.fullscreenButton = document.getElementById('fullscreen-button');
    DOM.canvasContainer = document.getElementById('canvas-container');
    DOM.instructionsOverlay = document.getElementById('instructions-overlay');
    DOM.closeInstructions = document.getElementById('close-instructions');

    // Attach event listeners
    attachEventListeners();

    // Simulate loading progress
    simulateLoading();
}

// ===================================
// Event Listeners
// ===================================
function attachEventListeners() {
    // Hotspot click - enter 360° view
    DOM.roomHotspot.addEventListener('click', () => {
        switchView('360');
    });

    // Back button - return to floorplan
    DOM.backButton.addEventListener('click', () => {
        switchView('floorplan');
    });

    // Zoom controls
    DOM.zoomInButton.addEventListener('click', zoomIn);
    DOM.zoomOutButton.addEventListener('click', zoomOut);

    // Fullscreen toggle
    DOM.fullscreenButton.addEventListener('click', toggleFullscreen);

    // Close instructions
    DOM.closeInstructions.addEventListener('click', () => {
        DOM.instructionsOverlay.classList.add('hidden');
    });

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

// ===================================
// Loading Simulation
// ===================================
function simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(finishLoading, 300);
        }
        DOM.loadingProgress.style.width = progress + '%';
    }, 100);
}

function finishLoading() {
    DOM.loadingScreen.classList.add('hidden');
    AppState.isLoading = false;
}

// ===================================
// View Switching
// ===================================
function switchView(view) {
    if (view === '360') {
        // Initialize 360° viewer if not already done
        if (!AppState.viewer360) {
            init360Viewer();
        }

        // Switch views
        DOM.floorplanView.classList.remove('active');
        DOM.viewer360View.classList.add('active');
        AppState.currentView = '360';

        // Start animation loop
        if (AppState.renderer) {
            animate();
        }
    } else {
        // Return to floorplan
        DOM.viewer360View.classList.remove('active');
        DOM.floorplanView.classList.add('active');
        AppState.currentView = 'floorplan';
    }
}

// ===================================
// 360° Viewer Initialization
// ===================================
function init360Viewer() {
    console.log('Initializing 360° viewer...');

    // Create scene
    AppState.scene = new THREE.Scene();
    AppState.scene.background = new THREE.Color(0x0a0a0a); // Dark background - MF Fitness theme

    // Create camera
    AppState.camera = new THREE.PerspectiveCamera(
        75, // FOV
        DOM.canvasContainer.clientWidth / DOM.canvasContainer.clientHeight, // Aspect ratio
        0.1, // Near plane
        1000 // Far plane
    );
    AppState.camera.position.set(0, 0, 0.1);

    // Create renderer
    AppState.renderer = new THREE.WebGLRenderer({ antialias: true });
    AppState.renderer.setSize(DOM.canvasContainer.clientWidth, DOM.canvasContainer.clientHeight);
    AppState.renderer.setPixelRatio(window.devicePixelRatio);
    DOM.canvasContainer.appendChild(AppState.renderer.domElement);

    // Show loading message
    const loadingText = document.createElement('div');
    loadingText.id = 'texture-loading';
    loadingText.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 18px;
        text-align: center;
        z-index: 10;
        background: rgba(15, 23, 42, 0.9);
        padding: 20px 40px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    loadingText.innerHTML = 'Loading 360° image...<br><small>Please wait</small>';
    DOM.canvasContainer.appendChild(loadingText);

    // Load 360° image texture
    const imagePath = 'images/IMG_20260202_165406_816.JPG';
    console.log('Loading image from:', imagePath);

    const textureLoader = new THREE.TextureLoader();

    // Add loading progress handler
    textureLoader.load(
        imagePath,
        // Success callback
        (texture) => {
            console.log('✓ 360° image loaded successfully!');
            loadingText.remove();

            // Create sphere geometry
            const geometry = new THREE.SphereGeometry(500, 60, 40);

            // Invert the geometry on the x-axis so the image is on the inside
            geometry.scale(-1, 1, 1);

            // Create material with the texture
            const material = new THREE.MeshBasicMaterial({
                map: texture
            });

            // Create mesh and add to scene
            const sphere = new THREE.Mesh(geometry, material);
            AppState.scene.add(sphere);

            AppState.texture = texture;
            console.log('360° sphere created and added to scene');
        },
        // Progress callback
        (progress) => {
            if (progress.lengthComputable) {
                const percentComplete = (progress.loaded / progress.total) * 100;
                console.log('Loading progress:', percentComplete.toFixed(2) + '%');
                loadingText.innerHTML = `Loading 360° image...<br><small>${percentComplete.toFixed(0)}%</small>`;
            }
        },
        // Error callback
        (error) => {
            console.error('✗ Error loading 360° image:', error);
            console.error('Attempted path:', imagePath);
            console.error('Current location:', window.location.href);

            // Show error message to user
            loadingText.innerHTML = `
                <div style="color: #f87171;">
                    <strong>⚠ Image Loading Error</strong><br>
                    <small style="color: #cbd5e1; margin-top: 8px; display: block;">
                        Could not load: ${imagePath}<br><br>
                        Please check:<br>
                        • File exists in the images folder<br>
                        • Filename matches exactly<br>
                        • Try using a local web server
                    </small>
                </div>
            `;

            // Create a colored sphere as fallback
            const geometry = new THREE.SphereGeometry(500, 60, 40);
            geometry.scale(-1, 1, 1);
            const material = new THREE.MeshBasicMaterial({
                color: 0x1e293b,
                wireframe: false
            });
            const sphere = new THREE.Mesh(geometry, material);
            AppState.scene.add(sphere);

            // Add some lights to make it visible
            const light = new THREE.PointLight(0x6366f1, 1, 1000);
            light.position.set(0, 0, 0);
            AppState.scene.add(light);
        }
    );

    // Add mouse/touch controls
    addControls();

    AppState.viewer360 = true;
    console.log('360° viewer initialization complete');
}

// ===================================
// Camera Controls
// ===================================
function addControls() {
    let isUserInteracting = false;
    let onPointerDownMouseX = 0;
    let onPointerDownMouseY = 0;
    let lon = 0;
    let onPointerDownLon = 0;
    let lat = 0;
    let onPointerDownLat = 0;
    let phi = 0;
    let theta = 0;

    const canvas = AppState.renderer.domElement;

    // Mouse down
    canvas.addEventListener('mousedown', (event) => {
        event.preventDefault();
        isUserInteracting = true;
        onPointerDownMouseX = event.clientX;
        onPointerDownMouseY = event.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
    });

    // Mouse move
    canvas.addEventListener('mousemove', (event) => {
        if (isUserInteracting) {
            lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
            lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
        }
    });

    // Mouse up
    canvas.addEventListener('mouseup', () => {
        isUserInteracting = false;
    });

    // Touch events for mobile
    canvas.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            event.preventDefault();
            onPointerDownMouseX = event.touches[0].pageX;
            onPointerDownMouseY = event.touches[0].pageY;
            onPointerDownLon = lon;
            onPointerDownLat = lat;
        }
    });

    canvas.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1) {
            event.preventDefault();
            lon = (onPointerDownMouseX - event.touches[0].pageX) * 0.1 + onPointerDownLon;
            lat = (event.touches[0].pageY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
        }
    });

    // Mouse wheel zoom
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const fov = AppState.camera.fov + event.deltaY * 0.05;
        AppState.camera.fov = THREE.MathUtils.clamp(fov, 30, 90);
        AppState.camera.updateProjectionMatrix();
    });

    // Update camera function
    AppState.updateCamera = () => {
        lat = Math.max(-85, Math.min(85, lat));
        phi = THREE.MathUtils.degToRad(90 - lat);
        theta = THREE.MathUtils.degToRad(lon);

        const x = 500 * Math.sin(phi) * Math.cos(theta);
        const y = 500 * Math.cos(phi);
        const z = 500 * Math.sin(phi) * Math.sin(theta);

        AppState.camera.lookAt(x, y, z);
    };
}

// ===================================
// Animation Loop
// ===================================
function animate() {
    if (AppState.currentView !== '360') return;

    requestAnimationFrame(animate);

    if (AppState.updateCamera) {
        AppState.updateCamera();
    }

    if (AppState.renderer && AppState.scene && AppState.camera) {
        AppState.renderer.render(AppState.scene, AppState.camera);
    }
}

// ===================================
// Zoom Controls
// ===================================
function zoomIn() {
    const fov = AppState.camera.fov - 5;
    AppState.camera.fov = THREE.MathUtils.clamp(fov, 30, 90);
    AppState.camera.updateProjectionMatrix();
}

function zoomOut() {
    const fov = AppState.camera.fov + 5;
    AppState.camera.fov = THREE.MathUtils.clamp(fov, 30, 90);
    AppState.camera.updateProjectionMatrix();
}

// ===================================
// Fullscreen Toggle
// ===================================
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ===================================
// Window Resize Handler
// ===================================
function onWindowResize() {
    if (AppState.camera && AppState.renderer) {
        AppState.camera.aspect = DOM.canvasContainer.clientWidth / DOM.canvasContainer.clientHeight;
        AppState.camera.updateProjectionMatrix();
        AppState.renderer.setSize(DOM.canvasContainer.clientWidth, DOM.canvasContainer.clientHeight);
    }
}

// ===================================
// Start Application
// ===================================
document.addEventListener('DOMContentLoaded', initApp);
