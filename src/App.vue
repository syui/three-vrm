<template>
	<div id="app">
	</div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils, VRMLookAt } from '@pixiv/three-vrm';
import { GridHelper, Mesh, MeshLambertMaterial, PlaneGeometry, Vector3, Color, DirectionalLight, Fog, HemisphereLight } from 'three';

// model
const defaultModelUrl = 'https://card.syui.ai/obj/ai.vrm';

// renderer
const renderer = new THREE.WebGLRenderer({
	alpha: true,
	antialias: true,
});
// add renderer
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

// camera
const camera = new THREE.PerspectiveCamera( 30.0, window.innerWidth / window.innerHeight, 0.1, 20.0 );
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
const light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1.0, 1.0, 1.0 ).normalize();
scene.add( light );

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
	loader.register( ( parser ) => {
		return new VRMLoaderPlugin( parser, { autoUpdateHumanBones: true } );
	} );

	loader.load(
		modelUrl,
		( gltf ) => {
			const vrm = gltf.userData.vrm;
			if ( currentVrm ) {
				scene.remove( currentVrm.scene );
				VRMUtils.deepDispose( currentVrm.scene );
				
			}
			currentVrm = vrm;
			scene.add( vrm.scene );
			vrm.scene.traverse( ( obj ) => {
				obj.frustumCulled = false;
			} );
			VRMUtils.rotateVRM0( vrm );
		},
		( progress ) => console.log( 'Loading model...', 100.0 * ( progress.loaded / progress.total ), '%' ),
		( error ) => console.error( error ),
	);

}

loadVRM( defaultModelUrl );

// animate
const clock = new THREE.Clock();
function animate() {
	requestAnimationFrame( animate );
	const deltaTime = clock.getDelta();
	if ( currentMixer ) {
		currentMixer.update( deltaTime );
	}
	if ( currentVrm ) {
		currentVrm.update( deltaTime );
	}

	const { lookAt } = currentVrm;
	renderer.render( scene, camera );
}

animate();
</script>

<style>

</style>
