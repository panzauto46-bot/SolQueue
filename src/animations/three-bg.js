import * as THREE from 'three';

export class ThreeBackground {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.cubes = [];
    this.particles = [];
    this.connections = [];
    this.mouse = { x: 0, y: 0 };
    this.clock = new THREE.Clock();
    this.isLanding = true;

    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 0, 30);
    this.camera.lookAt(0, 0, 0);

    this.createCubes();
    this.createParticles();
    this.createConnections();
    this.addLights();

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    this.animate();
  }

  createCubes() {
    const cubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x9945FF,
      transparent: true,
      opacity: 0.15,
      wireframe: false,
      shininess: 80,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x9945FF,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });

    const greenMaterial = new THREE.MeshPhongMaterial({
      color: 0x14F195,
      transparent: true,
      opacity: 0.12,
      wireframe: false,
      shininess: 80,
    });

    const greenWire = new THREE.MeshBasicMaterial({
      color: 0x14F195,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
    });

    const cyanMaterial = new THREE.MeshPhongMaterial({
      color: 0x00D4AA,
      transparent: true,
      opacity: 0.1,
      wireframe: false,
      shininess: 80,
    });

    const materials = [
      [cubeMaterial, wireframeMaterial],
      [greenMaterial, greenWire],
      [cyanMaterial, wireframeMaterial],
    ];

    for (let i = 0; i < 18; i++) {
      const size = Math.random() * 1.5 + 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const matPair = materials[Math.floor(Math.random() * materials.length)];

      const solidCube = new THREE.Mesh(geometry, matPair[0].clone());
      const wireCube = new THREE.Mesh(geometry, matPair[1].clone());

      const group = new THREE.Group();
      group.add(solidCube);
      group.add(wireCube);

      group.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      );

      group.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      group.userData = {
        velocity: {
          x: (Math.random() - 0.5) * 0.005,
          y: (Math.random() - 0.5) * 0.005,
          z: (Math.random() - 0.5) * 0.003,
        },
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.005,
        },
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: Math.random() * 0.5 + 0.2,
        floatAmplitude: Math.random() * 0.5 + 0.2,
      };

      this.scene.add(group);
      this.cubes.push(group);
    }
  }

  createParticles() {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const purpleColor = new THREE.Color(0x9945FF);
    const greenColor = new THREE.Color(0x14F195);
    const cyanColor = new THREE.Color(0x00D4AA);
    const colorOptions = [purpleColor, greenColor, cyanColor];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 3 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.particleSystem = points;
  }

  createConnections() {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x9945FF,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < this.cubes.length; i++) {
      for (let j = i + 1; j < this.cubes.length; j++) {
        const dist = this.cubes[i].position.distanceTo(this.cubes[j].position);
        if (dist < 20) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            this.cubes[i].position,
            this.cubes[j].position,
          ]);
          const line = new THREE.Line(geometry, lineMaterial.clone());
          line.userData = { i, j };
          this.scene.add(line);
          this.connections.push(line);
        }
      }
    }
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0x9945FF, 1, 50);
    purpleLight.position.set(10, 10, 10);
    this.scene.add(purpleLight);

    const greenLight = new THREE.PointLight(0x14F195, 0.8, 50);
    greenLight.position.set(-10, -10, 10);
    this.scene.add(greenLight);

    const cyanLight = new THREE.PointLight(0x00D4AA, 0.5, 40);
    cyanLight.position.set(0, 15, -5);
    this.scene.add(cyanLight);

    this.lights = { purpleLight, greenLight, cyanLight };
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  setMode(isLanding) {
    this.isLanding = isLanding;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    // Animate cubes
    this.cubes.forEach((cube) => {
      const { velocity, rotationSpeed, floatOffset, floatSpeed, floatAmplitude } = cube.userData;

      cube.rotation.x += rotationSpeed.x;
      cube.rotation.y += rotationSpeed.y;
      cube.rotation.z += rotationSpeed.z;

      cube.position.x += velocity.x;
      cube.position.y += velocity.y + Math.sin(time * floatSpeed + floatOffset) * floatAmplitude * 0.01;
      cube.position.z += velocity.z;

      // Boundary bounce
      if (Math.abs(cube.position.x) > 30) velocity.x *= -1;
      if (Math.abs(cube.position.y) > 18) velocity.y *= -1;
      if (Math.abs(cube.position.z) > 15) velocity.z *= -1;
    });

    // Animate particles
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time * 0.5 + i) * 0.003;
        positions[i] += Math.cos(time * 0.3 + i) * 0.002;
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
      this.particleSystem.rotation.y = time * 0.02;
    }

    // Update connections
    this.connections.forEach((line) => {
      const { i, j } = line.userData;
      const points = [this.cubes[i].position, this.cubes[j].position];
      line.geometry.setFromPoints(points);
      const dist = this.cubes[i].position.distanceTo(this.cubes[j].position);
      line.material.opacity = Math.max(0, 0.08 - dist * 0.003);
    });

    // Subtle camera movement based on mouse
    this.camera.position.x += (this.mouse.x * 3 - this.camera.position.x) * 0.02;
    this.camera.position.y += (this.mouse.y * 2 - this.camera.position.y) * 0.02;
    this.camera.lookAt(0, 0, 0);

    // Animate lights
    if (this.lights) {
      this.lights.purpleLight.position.x = Math.sin(time * 0.5) * 15;
      this.lights.purpleLight.position.y = Math.cos(time * 0.3) * 10;
      this.lights.greenLight.position.x = Math.cos(time * 0.4) * 12;
      this.lights.greenLight.position.y = Math.sin(time * 0.6) * 8;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
