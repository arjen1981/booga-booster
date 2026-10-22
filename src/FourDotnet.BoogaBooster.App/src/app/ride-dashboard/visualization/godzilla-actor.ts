import * as THREE from 'three';

/** Where the Godzilla model is served from (see `public/3dmodels/CREDITS.md`). */
export const GODZILLA_MODEL_URL = '/3dmodels/godzilla.glb';

/** Distance from the ride axis at which Godzilla stands, in metres (ride sweeps ≈ 9 m). */
export const GODZILLA_STAND_DISTANCE = 16;

/** Distance from the ride axis at which Godzilla enters and leaves, in metres. */
export const GODZILLA_SPAWN_DISTANCE = 45;

/** Height of the figure, in metres (≈ 2.5× the ride). */
export const GODZILLA_HEIGHT = 18;

/** Time to walk from the spawn point to the standing point, in seconds. */
export const GODZILLA_ENTER_SECONDS = 6;

/** Time to walk from the standing point back out to the spawn point, in seconds. */
export const GODZILLA_LEAVE_SECONDS = 6;

/** Time between roars while standing, in seconds. */
export const GODZILLA_ROAR_INTERVAL_SECONDS = 6;

/** Cross-fade between clips, in seconds. */
const FADE_SECONDS = 0.3;

/**
 * Bearing (unit vector on the ground plane) Godzilla arrives along: the far side
 * of the ride from the default camera at (18, 13, 18).
 */
const BEARING = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };

/** Phases of the actor; `loading` means wanted but the model is not yet here. */
export type GodzillaPhase = 'absent' | 'loading' | 'entering' | 'present' | 'leaving';

/** The looping clip Godzilla plays while in a phase. */
export type GodzillaClip = 'Walk' | 'Idle';

/** Where Godzilla is, which way it faces (rotation about Y) and what it is doing. */
export interface GodzillaPose {
  readonly x: number;
  readonly z: number;
  readonly heading: number;
  readonly clip: GodzillaClip;
}

/** The parts of a loaded glTF the actor needs. */
export interface GodzillaModel {
  readonly scene: THREE.Object3D;
  readonly animations: readonly THREE.AnimationClip[];
}

/** Produces the model; rejects when it cannot be loaded. */
export type GodzillaLoader = () => Promise<GodzillaModel>;

const pathFraction = (t: number, seconds: number) => Math.min(Math.max(t / seconds, 0), 1);

function poseAt(distance: number, facingRide: boolean, clip: GodzillaClip): GodzillaPose {
  const sign = facingRide ? -1 : 1;
  return {
    x: BEARING.x * distance,
    z: BEARING.z * distance,
    heading: Math.atan2(sign * BEARING.x, sign * BEARING.z),
    clip,
  };
}

/**
 * Pure walking path: the pose for a phase and the seconds spent in it. Entering
 * walks in from the spawn point facing the ride, leaving walks back out facing
 * away; `absent` and `loading` park the figure at the spawn point.
 */
export function godzillaPose(phase: GodzillaPhase, t: number): GodzillaPose {
  const span = GODZILLA_SPAWN_DISTANCE - GODZILLA_STAND_DISTANCE;
  switch (phase) {
    case 'entering':
      return poseAt(
        GODZILLA_SPAWN_DISTANCE - span * pathFraction(t, GODZILLA_ENTER_SECONDS),
        true,
        'Walk',
      );
    case 'leaving':
      return poseAt(
        GODZILLA_STAND_DISTANCE + span * pathFraction(t, GODZILLA_LEAVE_SECONDS),
        false,
        'Walk',
      );
    case 'present':
      return poseAt(GODZILLA_STAND_DISTANCE, true, 'Idle');
    default:
      return poseAt(GODZILLA_SPAWN_DISTANCE, true, 'Idle');
  }
}

/**
 * Elapsed time in the opposite walking phase that continues from the same spot
 * (entering ↔ leaving), so reversing mid-walk turns round without a jump.
 */
export function reversedElapsed(phase: 'entering' | 'leaving', t: number): number {
  const [from, to] =
    phase === 'entering'
      ? [GODZILLA_ENTER_SECONDS, GODZILLA_LEAVE_SECONDS]
      : [GODZILLA_LEAVE_SECONDS, GODZILLA_ENTER_SECONDS];
  return to * (1 - pathFraction(t, from));
}

/** Default loader: pulls `GLTFLoader` and the model in lazily, on first use. */
export const loadGodzillaModel: GodzillaLoader = async () => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  return new GLTFLoader().loadAsync(GODZILLA_MODEL_URL);
};

/** Scales the model to {@link GODZILLA_HEIGHT}, stands it on the ground and recolours it. */
export function prepareGodzillaModel(model: THREE.Object3D): THREE.Group {
  const box = new THREE.Box3().setFromObject(model);
  const height = box.max.y - box.min.y;
  const scale = height > 0 ? GODZILLA_HEIGHT / height : 1;
  model.scale.multiplyScalar(scale);
  model.position.y -= box.min.y * scale;

  model.traverse((object) => {
    const mesh = object as Partial<THREE.Mesh>;
    if (!mesh.isMesh) {
      return;
    }
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      recolour(material);
    }
  });

  const holder = new THREE.Group();
  holder.add(model);
  return holder;
}

function recolour(material: THREE.Material | undefined): void {
  const standard = material as THREE.MeshStandardMaterial | undefined;
  if (standard?.name === 'Dino_Main') {
    standard.color.set(0x2c3a30);
  } else if (standard?.name === 'Dino_Secondary') {
    standard.color.set(0xb8bcc2);
  }
}

/**
 * Drives the Godzilla figure: `absent → loading → entering → present → leaving →
 * absent`, advanced by {@link update} from the render loop. The model and its
 * loader are fetched only when Godzilla is first wanted, then cached. A failed
 * load is logged once and leaves the actor absent for good. Under reduced motion
 * it never walks: it appears at, and disappears from, the standing point.
 */
export class GodzillaActor {
  /** Add this to the scene; it is invisible whenever the actor is absent. */
  readonly root = new THREE.Group();

  private phaseValue: GodzillaPhase = 'absent';
  private elapsed = 0;
  private roarTimer = 0;
  private wanted = false;
  private loadStarted = false;
  private failed = false;
  private disposed = false;
  private model?: THREE.Group;
  private mixer?: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  private currentClip?: GodzillaClip;

  constructor(
    private readonly loader: GodzillaLoader,
    private readonly reducedMotion: boolean,
  ) {
    this.root.visible = false;
  }

  get phase(): GodzillaPhase {
    return this.phaseValue;
  }

  /** Advances the state machine by `dt` seconds; `wanted` is whether Godzilla should be there. */
  update(dt: number, wanted: boolean): void {
    this.wanted = wanted;
    if (this.disposed || this.failed) {
      return;
    }
    switch (this.phaseValue) {
      case 'absent':
        if (wanted) {
          this.model ? this.appear() : this.startLoading();
        }
        break;
      case 'loading':
        // Nothing to see yet; the load resolution decides what happens next.
        break;
      case 'entering':
        this.advanceEntering(dt, wanted);
        break;
      case 'present':
        this.advancePresent(dt, wanted);
        break;
      case 'leaving':
        this.advanceLeaving(dt, wanted);
        break;
    }
    this.applyPose();
    if (!this.reducedMotion) {
      this.mixer?.update(dt);
    }
  }

  /** Stops animation and releases the model's GPU resources. */
  dispose(): void {
    this.disposed = true;
    this.root.removeFromParent();
    this.mixer?.stopAllAction();
    if (this.model) {
      this.mixer?.uncacheRoot(this.model);
      disposeObject(this.model);
    }
    this.mixer = undefined;
    this.actions.clear();
    this.model = undefined;
  }

  private startLoading(): void {
    if (this.loadStarted) {
      return;
    }
    this.loadStarted = true;
    this.phaseValue = 'loading';
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const loaded = await this.loader();
      if (this.disposed) {
        disposeObject(loaded.scene);
        return;
      }
      this.install(loaded);
      if (this.phaseValue === 'loading') {
        this.phaseValue = 'absent';
        if (this.wanted) {
          this.appear();
        }
      }
    } catch (error) {
      this.failed = true;
      this.phaseValue = 'absent';
      this.root.visible = false;
      console.warn('Godzilla model could not be loaded; he stays away.', error);
    }
  }

  private install(loaded: GodzillaModel): void {
    this.model = prepareGodzillaModel(loaded.scene);
    this.root.add(this.model);
    const mixer = new THREE.AnimationMixer(this.model);
    this.mixer = mixer;
    for (const name of ['Walk', 'Idle', 'Punch']) {
      const clip = loaded.animations.find((c) => c.name === name || c.name.endsWith(`|${name}`));
      if (clip) {
        this.actions.set(name, mixer.clipAction(clip));
      }
    }
    mixer.addEventListener('finished', (event) => {
      if (event.action === this.actions.get('Punch')) {
        this.playLoop(this.currentClip ?? 'Idle', true);
      }
    });
  }

  /** Begins entering (or, under reduced motion, stands there at once). */
  private appear(): void {
    this.root.visible = true;
    this.elapsed = 0;
    this.roarTimer = 0;
    this.currentClip = undefined;
    this.phaseValue = this.reducedMotion ? 'present' : 'entering';
  }

  private disappear(): void {
    this.phaseValue = 'absent';
    this.root.visible = false;
    this.mixer?.stopAllAction();
    this.currentClip = undefined;
  }

  private advanceEntering(dt: number, wanted: boolean): void {
    if (!wanted) {
      this.elapsed = reversedElapsed('entering', this.elapsed);
      this.phaseValue = 'leaving';
      return;
    }
    this.elapsed += dt;
    if (this.elapsed >= GODZILLA_ENTER_SECONDS) {
      this.elapsed = 0;
      this.roarTimer = 0;
      this.phaseValue = 'present';
    }
  }

  private advancePresent(dt: number, wanted: boolean): void {
    if (!wanted) {
      if (this.reducedMotion) {
        this.disappear();
      } else {
        this.elapsed = 0;
        this.phaseValue = 'leaving';
      }
      return;
    }
    if (this.reducedMotion) {
      return;
    }
    this.roarTimer += dt;
    if (this.roarTimer >= GODZILLA_ROAR_INTERVAL_SECONDS) {
      this.roarTimer = 0;
      this.roar();
    }
  }

  private advanceLeaving(dt: number, wanted: boolean): void {
    if (wanted) {
      this.elapsed = reversedElapsed('leaving', this.elapsed);
      this.phaseValue = 'entering';
      return;
    }
    this.elapsed += dt;
    if (this.elapsed >= GODZILLA_LEAVE_SECONDS) {
      this.disappear();
    }
  }

  private applyPose(): void {
    if (this.phaseValue === 'absent' || this.phaseValue === 'loading') {
      return;
    }
    const pose = godzillaPose(this.phaseValue, this.elapsed);
    this.root.position.set(pose.x, 0, pose.z);
    this.root.rotation.y = pose.heading;
    if (pose.clip !== this.currentClip) {
      this.playLoop(pose.clip, this.currentClip !== undefined && !this.reducedMotion);
      this.currentClip = pose.clip;
    }
  }

  private playLoop(clip: GodzillaClip, fade: boolean): void {
    const next = this.actions.get(clip);
    if (!next) {
      return;
    }
    for (const action of this.actions.values()) {
      if (action !== next && action.isRunning()) {
        if (fade) {
          action.fadeOut(FADE_SECONDS);
        } else {
          action.stop();
        }
      }
    }
    next.reset().setLoop(THREE.LoopRepeat, Infinity);
    if (fade) {
      next.fadeIn(FADE_SECONDS);
    }
    next.play();
    if (this.reducedMotion) {
      this.mixer?.update(0);
    }
  }

  private roar(): void {
    const punch = this.actions.get('Punch');
    const idle = this.actions.get('Idle');
    if (!punch) {
      return;
    }
    idle?.fadeOut(FADE_SECONDS);
    punch.reset().setLoop(THREE.LoopOnce, 1);
    punch.clampWhenFinished = false;
    punch.fadeIn(FADE_SECONDS).play();
  }
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as Partial<THREE.Mesh>;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) {
        continue;
      }
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) {
          value.dispose();
        }
      }
      material.dispose();
    }
  });
}
