import { OrthographicCamera, ShaderMaterial, Color, Box3, WebGLRenderTarget } from "three";

class ObjectIdMaterial extends ShaderMaterial {
  constructor(color) {
    super({
      vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
      `,
      fragmentShader: `
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4(color, 1.0);
      }
      `,
      uniforms: {
        color: { value: color }
      }
    });
  }
}

export default class VisibilitySystem {
  constructor(renderer, visibilityCellSize = 2) {
    this.renderer = renderer;
    this.visibilityCellSize = visibilityCellSize;
    this.cells = [];
  }

  computeVisibilityVolumes(scene, navMesh) {
    const savedMaterials = new Map();

    scene.traverse(object => {
      if (object.material) {
        savedMaterials.set(object, object.material);
      }
    });

    const objects = Array.from(savedMaterials.keys());
    let i = 0;
    for (const object of objects) {
      const value = 0xffffff * (i++ / objects.length);
      console.log(value);
      object.material = new ObjectIdMaterial(new Color(value));
    }

    const visibilityCamera = new OrthographicCamera(
      -this.visibilityCellSize / 2,
      this.visibilityCellSize / 2,
      this.visibilityCellSize / 2,
      -this.visibilityCellSize / 2,
      0.0001,
      10000
    );

    const navMeshBounds = new Box3().expandByObject(navMesh);

    const min = navMeshBounds.min.floor();
    min.y -= this.visibilityCellSize;
    const max = navMeshBounds.max.ceil();
    max.y += this.visibilityCellSize;

    // const mesh = new BoxBufferGeometry(
    //   this.visibilityCellSize,
    //   this.visibilityCellSize,
    //   this.visibilityCellSize,
    //   1,
    //   1,
    //   1
    // );
    // const material = new MeshBasicMaterial({ wireframe: true });
    const idRenderTarget = new WebGLRenderTarget(512, 512);
    this.renderer.setRenderTarget(idRenderTarget);

    for (let x = min.x; x <= max.x; x += this.visibilityCellSize) {
      for (let y = min.y; y <= max.y; y += this.visibilityCellSize) {
        for (let z = min.z; z <= max.z; z += this.visibilityCellSize) {
          // const cell = new Mesh(mesh, material);
          // cell.position.set(x, y, z);
          // scene.add(cell);
          visibilityCamera.position.set(x, y, z);
          this.renderer.render(scene, visibilityCamera); // Forward
          this.renderer.render(scene, visibilityCamera); // Forward
        }
      }
    }

    // scene.traverse(object => {
    //   if (object.material) {
    //     object.material = savedMaterials.get(object);
    //   }
    // });
  }

  update() {}
}
