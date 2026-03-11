<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { spring } from 'svelte/motion';

    let { onclick }: { onclick?: () => void } = $props();

    let rotationY = $state(0);
    let hovered = $state(false);
    let spinBoost = $state(0);

    const coinScale = spring(1, { stiffness: 0.15, damping: 0.4 });

    useTask((delta) => {
        const baseSpeed = hovered ? 1.5 : 0.8;
        rotationY += (baseSpeed + spinBoost) * delta;
        if (spinBoost > 0) {
            spinBoost = Math.max(0, spinBoost - delta * 8);
        }
    });

    function handleClick() {
        spinBoost = 12;
        coinScale.set(1.15);
        setTimeout(() => coinScale.set(1), 200);
        onclick?.();
    }

    function handlePointerEnter() {
        hovered = true;
        document.body.style.cursor = 'pointer';
    }

    function handlePointerLeave() {
        hovered = false;
        document.body.style.cursor = 'auto';
    }
</script>

<T.PerspectiveCamera makeDefault position={[0, 0.3, 4]} fov={45} />

<!-- Lighting -->
<T.AmbientLight intensity={0.4} />
<T.DirectionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" castShadow />
<T.DirectionalLight position={[-3, 2, -2]} intensity={0.4} color="#ffd700" />
<T.PointLight position={[0, 3, 2]} intensity={0.8} color="#fff4cc" />

<!-- Main coin group -->
<T.Group
    rotation.y={rotationY}
    scale={$coinScale}
    onclick={handleClick}
    onpointerenter={handlePointerEnter}
    onpointerleave={handlePointerLeave}
>
    <!-- Coin disc -->
    <T.Mesh rotation.x={Math.PI / 2}>
        <T.CylinderGeometry args={[1.2, 1.2, 0.12, 64]} />
        <T.MeshStandardMaterial
            color="#FFD700"
            metalness={0.85}
            roughness={0.15}
            emissive="#B8860B"
            emissiveIntensity={0.1}
        />
    </T.Mesh>

    <!-- Front face rim -->
    <T.Mesh position.z={0.061}>
        <T.RingGeometry args={[0.95, 1.15, 64]} />
        <T.MeshStandardMaterial
            color="#DAA520"
            metalness={0.9}
            roughness={0.1}
        />
    </T.Mesh>

    <!-- Back face rim -->
    <T.Mesh position.z={-0.061} rotation.y={Math.PI}>
        <T.RingGeometry args={[0.95, 1.15, 64]} />
        <T.MeshStandardMaterial
            color="#DAA520"
            metalness={0.9}
            roughness={0.1}
        />
    </T.Mesh>

    <!-- Front "$" symbol - vertical bar -->
    <T.Mesh position={[0, 0, 0.07]}>
        <T.BoxGeometry args={[0.08, 0.7, 0.01]} />
        <T.MeshStandardMaterial
            color="#B8860B"
            metalness={0.95}
            roughness={0.1}
        />
    </T.Mesh>

    <!-- "$" S-curve top -->
    <T.Mesh position={[0, 0.12, 0.07]}>
        <T.TorusGeometry args={[0.18, 0.04, 8, 16, Math.PI]} />
        <T.MeshStandardMaterial
            color="#B8860B"
            metalness={0.95}
            roughness={0.1}
        />
    </T.Mesh>

    <!-- "$" S-curve bottom -->
    <T.Mesh position={[0, -0.12, 0.07]} rotation.z={Math.PI}>
        <T.TorusGeometry args={[0.18, 0.04, 8, 16, Math.PI]} />
        <T.MeshStandardMaterial
            color="#B8860B"
            metalness={0.95}
            roughness={0.1}
        />
    </T.Mesh>

    <!-- Inner decorative circle (front) -->
    <T.Mesh position.z={0.065}>
        <T.RingGeometry args={[0.55, 0.6, 64]} />
        <T.MeshStandardMaterial
            color="#B8860B"
            metalness={0.9}
            roughness={0.15}
        />
    </T.Mesh>
</T.Group>
