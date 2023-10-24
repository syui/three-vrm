<template>
	<div id="app">
	</div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils, VRMLookAt, VRMSchema } from '@pixiv/three-vrm';
import { GridHelper, Mesh, MeshLambertMaterial, PlaneGeometry, Vector3, Color, DirectionalLight, Fog, HemisphereLight, AnimationAction, AnimationClip, AnimationMixer, MathUtils, Matrix4, Quaternion, PerspectiveCamera } from 'three';

// model
const defaultModelUrl = 'https://card.syui.ai/obj/ai.vrm';

// lookat
const _v3A = new THREE.Vector3();
class VRMSmoothLookAt extends VRMLookAt {
	constructor(humanoid, applier) {
		super(humanoid, applier);
		this.smoothFactor = 10.0;
		this.yawLimit = 45.0;
		this.pitchLimit = 45.0;
		this._yawDamped = 0.0;
		this._pitchDamped = 0.0;
	}
	update(delta) {
		if ( this.target && this.autoUpdate ) {
			this.lookAt( this.target.getWorldPosition( _v3A ) );
			if (
				this.yawLimit < Math.abs( this._yaw ) ||
					this.pitchLimit < Math.abs( this._pitch )
			) {
				this._yaw = 0.0;
				this._pitch = 0.0;
			}
			const k = 1.0 - Math.exp( - this.smoothFactor * delta );
			this._yawDamped += ( this._yaw - this._yawDamped ) * k;
			this._pitchDamped += ( this._pitch - this._pitchDamped ) * k;
			this.applier.applyYawPitch( this._yawDamped, this._pitchDamped );
			this._needsUpdate = false;
		}
		if ( this._needsUpdate ) {
			this._needsUpdate = false;
			this.applier.applyYawPitch( this._yaw, this._pitch );
		}
	}
}

// renderer
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

// camera
const camera = new PerspectiveCamera( 30.0, window.innerWidth / window.innerHeight, 0.1, 20.0 );
camera.position.set( 0.0, 1.0, 5.0 );

// camera controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.screenSpacePanning = false;
controls.target.set( 0.0, 1.0, 0.0 );
controls.update();

// scene
const scene = new THREE.Scene();

// add color
const bgColor = new Color(0xffffff);
scene.background = new Color(bgColor);
scene.fog = new Fog(bgColor, 3, 10);
const ambiantLight = new HemisphereLight(0xffffff, 0x444444);
ambiantLight.position.set(0, 20, 0);
scene.add(ambiantLight);

// add mesh
const floor = new Mesh(
  new PlaneGeometry(100, 100),
  new MeshLambertMaterial({
    color: 0xffffff,
    depthWrite: true,
  })
);
floor.position.y = -0.5;
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const grid = new GridHelper(50, 100, 0xffffff, 0xffffff);
scene.add(grid);

// light
const light = new THREE.DirectionalLight(0xffffff);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

// gltf and vrm
let currentVrm = undefined;
let currentAnimationUrl = undefined;
let currentMixer = undefined;
const helperRoot = new THREE.Group();
helperRoot.renderOrder = 10000;
scene.add( helperRoot );

function loadVRM( modelUrl ) {
	const loader = new GLTFLoader();
	loader.crossOrigin = 'anonymous';
	helperRoot.clear();
	loader.register((parser) => {
		return new VRMLoaderPlugin(parser, { autoUpdateHumanBones: true } );
	});
	loader.load(
		modelUrl,
		(gltf) => {
			const vrm = gltf.userData.vrm;
			VRMUtils.removeUnnecessaryVertices(gltf.scene);
			VRMUtils.removeUnnecessaryJoints(gltf.scene);
			//VRMUtils.rotateVRM0(vrm);
			
			vrm.scene.traverse((obj) => {
				obj.frustumCulled = false;
			});

			// replace the lookAt to our extended one
			const smoothLookAt = new VRMSmoothLookAt(vrm.humanoid, vrm.lookAt.applier);
			smoothLookAt.copy(vrm.lookAt);
			vrm.lookAt = smoothLookAt;
			scene.add(vrm.scene);
			currentVrm = vrm;
			vrm.lookAt.target = camera;
			currentVrm.humanoid.getNormalizedBoneNode('leftUpperArm').rotation.z = 1.3;
			currentVrm.humanoid.getNormalizedBoneNode('rightUpperArm').rotation.z = -1.3;
		},
	)
}

loadVRM( defaultModelUrl );

function blink(){
	var rand = Math.random()
	if (rand > .9) {
		currentVrm.expressionManager.setValue('blink', 1);
	} else {
		currentVrm.expressionManager.setValue('blink', 0);
	}
}

// animate
const clock = new THREE.Clock();
function animate() {
	requestAnimationFrame(animate);
	const delta = clock.getDelta();
	if (currentMixer) {
		currentMixer.update(delta);
	}
	if (currentVrm) {
		const s = 0.01 * Math.PI * Math.sin(Math.PI * clock.elapsedTime);
		blink();
		currentVrm.humanoid.getNormalizedBoneNode('neck').rotation.y = s;
		currentVrm.scene.rotation.y = Math.PI * Math.sin(clock.getElapsedTime());
		currentVrm.update(delta);
	}
	renderer.render(scene, camera);
}
animate();
</script>

<style>
</style>
