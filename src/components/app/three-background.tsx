"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    let scrollY = 0;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfff4e2, 0.02);
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const padlockGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2e4c8c,
      roughness: 0.2,
      metalness: 0.9,
    });
    const shackleMat = new THREE.MeshStandardMaterial({
      color: 0xfe1413,
      roughness: 0.1,
      metalness: 1.0,
    });
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.8,
    });

    const bodyBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.8, 1.2),
      bodyMat
    );
    bodyBase.position.y = -1;
    padlockGroup.add(bodyBase);
    const shackleGroup = new THREE.Group();
    const shackleArc = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.35, 32, 64, Math.PI),
      shackleMat
    );
    shackleArc.position.y = 0.8;
    shackleGroup.add(shackleArc);
    const lL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.8, 32),
      shackleMat
    );
    lL.position.set(-1.3, -0.1, 0);
    shackleGroup.add(lL);
    const lR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.8, 32),
      shackleMat
    );
    lR.position.set(1.3, -0.1, 0);
    shackleGroup.add(lR);
    shackleGroup.position.y = 0.5;
    padlockGroup.add(shackleGroup);
    const kh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32),
      shackleMat
    );
    kh.position.set(0, -1, 0.61);
    kh.rotation.x = Math.PI / 2;
    padlockGroup.add(kh);
    const ks = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.1), keyMat);
    ks.position.set(0, -1, 0.63);
    padlockGroup.add(ks);
    scene.add(padlockGroup);

    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 60;
      posArray[i + 1] = (Math.random() - 0.5) * 100;
      posArray[i + 2] = (Math.random() - 0.5) * 40;
    }
    particlesGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );
    const particleSystem = new THREE.Points(
      particlesGeo,
      new THREE.PointsMaterial({
        size: 0.05,
        color: 0xfe1413,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(particleSystem);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    const mainL = new THREE.DirectionalLight(0x7aced8, 3.0);
    mainL.position.set(5, 10, 8);
    scene.add(mainL);
    const rimL = new THREE.PointLight(0xfe1413, 2.0, 20);
    rimL.position.set(-5, 2, -5);
    scene.add(rimL);

    const updateLayout = () => {
      if (window.innerWidth < 768) {
        padlockGroup.position.set(0, -2.2, 0);
        padlockGroup.scale.set(0.45, 0.45, 0.45);
      } else {
        padlockGroup.position.set(4, 0, 0);
        padlockGroup.scale.set(0.7, 0.7, 0.7);
      }
    };
    updateLayout();

    let sY = 0.5,
      sRot = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollY = currentScrollY;
      const scrollPct = Math.min(currentScrollY / (window.innerHeight * 0.5), 1);
      if (scrollPct < 0.5) {
        sY = 0.5 + scrollPct * 2.0;
        sRot = 0;
      } else {
        sY = 1.5;
        sRot = (scrollPct - 0.5) * 2 * (Math.PI / 1.5);
      }
      particleSystem.position.y = currentScrollY * 0.02;
    };
    window.addEventListener("scroll", handleScroll);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      shackleGroup.position.y += (sY - shackleGroup.position.y) * 0.1;
      shackleGroup.rotation.y += (-sRot - shackleGroup.rotation.y) * 0.1;
      padlockGroup.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
      particleSystem.rotation.y += 0.0002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      updateLayout();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div id="canvas-container" className="fixed top-0 left-0 w-full h-full -z-10" ref={mountRef} />;
}
