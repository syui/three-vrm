import { WebGLRenderer } from 'three';
import * as THREE from 'three';
export let renderer: WebGLRenderer | undefined;

export function init(canvas: HTMLCanvasElement | OffscreenCanvas) {
	if (!renderer) renderer = new WebGLRenderer({
		alpha: true,
		antialias: true,
		canvas,
	});
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	renderer.setPixelRatio( window.devicePixelRatio );
	return renderer;
}

