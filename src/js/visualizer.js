const THREE = require('three');

class Visualizer {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });

        this.particles = null;
        this.particleSystem = null;
        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.camera.position.z = 30;

        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        this.createGlobe();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate();
    }

    createGlobe() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
        }

        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);

        const color = new THREE.Color(0x06b6d4);

        for (let i = 0; i < particleCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            const r = 10;

            const x = r * Math.cos(theta) * Math.sin(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            originalPositions[i * 3] = x;
            originalPositions[i * 3 + 1] = y;
            originalPositions[i * 3 + 2] = z;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    updateToGrid(count) {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
        }

        const particleCount = Math.max(count, 1000);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        const color = new THREE.Color(0x06b6d4);

        const cols = Math.ceil(Math.sqrt(particleCount));
        const spacing = 1.5;
        const offset = (cols * spacing) / 2;

        for (let i = 0; i < particleCount; i++) {
            const x = (i % cols) * spacing - offset;
            const y = Math.floor(i / cols) * spacing - offset;
            const z = (Math.random() - 0.5) * 5;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            originalPositions[i * 3] = x;
            originalPositions[i * 3 + 1] = y;
            originalPositions[i * 3 + 2] = z;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
        this.particleSystem.rotation.set(0, 0, 0);
    }

    shootLaser() {
        if (!this.particleSystem) return;

        const positions = this.particleSystem.geometry.attributes.position.array;
        const count = positions.length / 3;
        const targetIndex = Math.floor(Math.random() * count);

        const tx = positions[targetIndex * 3];
        const ty = positions[targetIndex * 3 + 1];
        const tz = positions[targetIndex * 3 + 2];

        // beam group
        const beamGroup = new THREE.Group();

        const corePoints = [
            new THREE.Vector3(0, -15, 20),
            new THREE.Vector3(tx, ty, tz)
        ];
        const coreGeometry = new THREE.BufferGeometry().setFromPoints(corePoints);
        const coreMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 1
        });
        const coreLine = new THREE.Line(coreGeometry, coreMaterial);
        beamGroup.add(coreLine);

        // glow lines
        const glowMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });
        for (let i = 0; i < 5; i++) {
            const offset = (Math.random() - 0.5) * 0.5;
            const glowPoints = [
                new THREE.Vector3(offset, -15 + offset, 20),
                new THREE.Vector3(tx + offset, ty + offset, tz)
            ];
            const glowGeometry = new THREE.BufferGeometry().setFromPoints(glowPoints);
            const glowLine = new THREE.Line(glowGeometry, glowMaterial.clone());
            beamGroup.add(glowLine);
        }

        this.scene.add(beamGroup);

        // explosion particles
        const explosionGeometry = new THREE.BufferGeometry();
        const explosionCount = 20;
        const explosionPositions = new Float32Array(explosionCount * 3);
        const explosionVelocities = [];

        for (let i = 0; i < explosionCount; i++) {
            explosionPositions[i * 3] = tx;
            explosionPositions[i * 3 + 1] = ty;
            explosionPositions[i * 3 + 2] = tz;
            explosionVelocities.push({
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5,
                z: (Math.random() - 0.5) * 0.5
            });
        }

        explosionGeometry.setAttribute('position', new THREE.BufferAttribute(explosionPositions, 3));
        const explosionMaterial = new THREE.PointsMaterial({
            color: 0x00ff00,
            size: 0.3,
            transparent: true,
            opacity: 1
        });
        const explosion = new THREE.Points(explosionGeometry, explosionMaterial);
        this.scene.add(explosion);

        // Flash target green
        const colors = this.particleSystem.geometry.attributes.color.array;
        const originalColor = {
            r: colors[targetIndex * 3],
            g: colors[targetIndex * 3 + 1],
            b: colors[targetIndex * 3 + 2]
        };
        colors[targetIndex * 3] = 0;
        colors[targetIndex * 3 + 1] = 1;
        colors[targetIndex * 3 + 2] = 0;
        this.particleSystem.geometry.attributes.color.needsUpdate = true;

        let frame = 0;
        const maxFrames = 60;

        const animate = () => {
            frame++;
            const progress = frame / maxFrames;

            beamGroup.children.forEach(child => {
                child.material.opacity = 1 - progress;
            });

            const expPos = explosion.geometry.attributes.position.array;
            for (let i = 0; i < explosionCount; i++) {
                expPos[i * 3] += explosionVelocities[i].x;
                expPos[i * 3 + 1] += explosionVelocities[i].y;
                expPos[i * 3 + 2] += explosionVelocities[i].z;
            }
            explosion.geometry.attributes.position.needsUpdate = true;
            explosionMaterial.opacity = 1 - progress;

            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(beamGroup);
                beamGroup.children.forEach(child => {
                    child.geometry.dispose();
                    child.material.dispose();
                });

                this.scene.remove(explosion);
                explosionGeometry.dispose();
                explosionMaterial.dispose();

                colors[targetIndex * 3] = originalColor.r;
                colors[targetIndex * 3 + 1] = originalColor.g;
                colors[targetIndex * 3 + 2] = originalColor.b;
                this.particleSystem.geometry.attributes.color.needsUpdate = true;
            }
        };
        animate();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const time = this.clock.getElapsedTime();

        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        if (this.particleSystem) {
            this.particleSystem.rotation.y += 0.001 + (this.mouse.x * 0.01);
            this.particleSystem.rotation.x += (this.mouse.y * 0.01);

            const positions = this.particleSystem.geometry.attributes.position.array;
            const originalPositions = this.particleSystem.geometry.attributes.originalPosition.array;

            for (let i = 0; i < positions.length; i += 3) {
                const x = originalPositions[i];
                const z = originalPositions[i + 2];
                positions[i + 2] = z + Math.sin(time + x * 0.5) * 0.5;
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.visualizer = new Visualizer();
