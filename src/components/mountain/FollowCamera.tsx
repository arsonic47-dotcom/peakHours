"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface FollowCameraProps {
  target: THREE.Vector3;
  direction: THREE.Vector3;
}

export function FollowCamera({ target, direction }: FollowCameraProps) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(20, 15, 20));

  useFrame(() => {
    const behind = new THREE.Vector3()
      .copy(direction)
      .multiplyScalar(-10);
    behind.y = 5;

    const desiredPos = new THREE.Vector3().copy(target).add(behind);

    currentPos.current.lerp(desiredPos, 0.04);

    camera.position.copy(currentPos.current);
    camera.lookAt(target);
  });

  return null;
}
