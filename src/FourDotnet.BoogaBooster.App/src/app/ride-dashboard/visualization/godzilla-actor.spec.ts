import * as THREE from 'three';

import {
  GODZILLA_ENTER_SECONDS,
  GODZILLA_HEIGHT,
  GODZILLA_LEAVE_SECONDS,
  GODZILLA_SPAWN_DISTANCE,
  GODZILLA_STAND_DISTANCE,
  GodzillaActor,
  GodzillaLoader,
  godzillaPose,
  prepareGodzillaModel,
  reversedElapsed,
} from './godzilla-actor';

const SWEPT_RADIUS = 9;
const distance = (pose: { x: number; z: number }) => Math.hypot(pose.x, pose.z);
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function stubModel(): THREE.Group {
  const scene = new THREE.Group();
  const main = new THREE.MeshStandardMaterial({ name: 'Dino_Main' });
  const secondary = new THREE.MeshStandardMaterial({ name: 'Dino_Secondary' });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), [main, secondary]);
  body.position.y = 3; // not standing on the ground, to prove it gets re-seated
  scene.add(body);
  return scene;
}

function clip(name: string): THREE.AnimationClip {
  return new THREE.AnimationClip(name, 1, []);
}

function stubLoader() {
  return vi.fn<GodzillaLoader>(async () => ({
    scene: stubModel(),
    animations: [
      clip('CharacterArmature|Walk'),
      clip('CharacterArmature|Idle'),
      clip('CharacterArmature|Punch'),
    ],
  }));
}

/** Requests Godzilla and lets the (stub) load land. */
async function summon(actor: GodzillaActor): Promise<void> {
  actor.update(0, true);
  await flush();
  actor.update(0, true);
}

describe('godzillaPose', () => {
  it('stands 16 m from the ride axis, outside the swept radius, facing the ride', () => {
    const pose = godzillaPose('present', 0);

    expect(distance(pose)).toBeCloseTo(GODZILLA_STAND_DISTANCE, 5);
    expect(distance(pose)).toBeGreaterThan(SWEPT_RADIUS);
    expect(pose.clip).toBe('Idle');
    // The facing direction (sin h, cos h) points from the figure towards the origin.
    expect(Math.sin(pose.heading) * pose.x + Math.cos(pose.heading) * pose.z).toBeLessThan(0);
  });

  it('stands on the far side from the default camera at (18, 13, 18)', () => {
    const pose = godzillaPose('present', 0);

    expect(pose.x).toBeLessThan(0);
    expect(pose.z).toBeLessThan(0);
  });

  it('walks in from 45 m to the standing point', () => {
    expect(distance(godzillaPose('entering', 0))).toBeCloseTo(GODZILLA_SPAWN_DISTANCE, 5);
    expect(distance(godzillaPose('entering', GODZILLA_ENTER_SECONDS))).toBeCloseTo(
      GODZILLA_STAND_DISTANCE,
      5,
    );
    expect(godzillaPose('entering', 1).clip).toBe('Walk');
  });

  it('walks out from the standing point to 45 m, facing away', () => {
    const start = godzillaPose('leaving', 0);
    const end = godzillaPose('leaving', GODZILLA_LEAVE_SECONDS);

    expect(distance(start)).toBeCloseTo(GODZILLA_STAND_DISTANCE, 5);
    expect(distance(end)).toBeCloseTo(GODZILLA_SPAWN_DISTANCE, 5);
    expect(Math.abs(start.heading - godzillaPose('present', 0).heading)).toBeCloseTo(Math.PI, 5);
  });

  it('clamps the elapsed time to the path', () => {
    expect(distance(godzillaPose('entering', 999))).toBeCloseTo(GODZILLA_STAND_DISTANCE, 5);
    expect(distance(godzillaPose('leaving', -5))).toBeCloseTo(GODZILLA_STAND_DISTANCE, 5);
  });

  it('reverses a walk from the same spot', () => {
    const entering = godzillaPose('entering', 2);
    const leaving = godzillaPose('leaving', reversedElapsed('entering', 2));

    expect(distance(leaving)).toBeCloseTo(distance(entering), 5);
  });
});

describe('prepareGodzillaModel', () => {
  it('scales the figure to 18 m, seats it on the ground and recolours the dino materials', () => {
    const holder = prepareGodzillaModel(stubModel());
    const box = new THREE.Box3().setFromObject(holder);

    expect(box.max.y - box.min.y).toBeCloseTo(GODZILLA_HEIGHT, 4);
    expect(box.min.y).toBeCloseTo(0, 4);

    const materials = (holder.children[0].children[0] as THREE.Mesh)
      .material as THREE.MeshStandardMaterial[];
    expect(materials[0].color.getHex()).not.toBe(0xffffff);
    expect(materials[1].color.getHex()).not.toBe(0xffffff);
    expect(materials[0].color.getHex()).not.toBe(materials[1].color.getHex());
  });
});

describe('GodzillaActor', () => {
  it('loads nothing until Godzilla is first wanted', () => {
    const loader = stubLoader();
    const actor = new GodzillaActor(loader, false);

    actor.update(1, false);
    actor.update(1, false);

    expect(loader).not.toHaveBeenCalled();
    expect(actor.phase).toBe('absent');
    expect(actor.root.visible).toBe(false);
  });

  it('goes absent -> loading -> entering -> present -> leaving -> absent', async () => {
    const loader = stubLoader();
    const actor = new GodzillaActor(loader, false);

    actor.update(0, true);
    expect(actor.phase).toBe('loading');
    expect(loader).toHaveBeenCalledTimes(1);

    await flush();
    actor.update(0, true);
    expect(actor.phase).toBe('entering');
    expect(actor.root.visible).toBe(true);

    actor.update(GODZILLA_ENTER_SECONDS, true);
    expect(actor.phase).toBe('present');
    expect(distance(actor.root.position)).toBeCloseTo(GODZILLA_STAND_DISTANCE, 5);

    actor.update(0.1, false);
    expect(actor.phase).toBe('leaving');

    actor.update(GODZILLA_LEAVE_SECONDS, false);
    expect(actor.phase).toBe('absent');
    expect(actor.root.visible).toBe(false);
  });

  it('turns round and leaves when the regime ends while entering', async () => {
    const actor = new GodzillaActor(stubLoader(), false);
    await summon(actor);
    actor.update(2, true);
    const before = distance(actor.root.position);

    actor.update(0, false);

    expect(actor.phase).toBe('leaving');
    expect(distance(actor.root.position)).toBeCloseTo(before, 3);
  });

  it('comes back when the regime returns while leaving', async () => {
    const actor = new GodzillaActor(stubLoader(), false);
    await summon(actor);
    actor.update(GODZILLA_ENTER_SECONDS, true);
    actor.update(0, false);
    actor.update(2, false);
    expect(actor.phase).toBe('leaving');

    actor.update(0, true);

    expect(actor.phase).toBe('entering');
  });

  it('reuses the cached model on a second appearance', async () => {
    const loader = stubLoader();
    const actor = new GodzillaActor(loader, false);
    await summon(actor);
    actor.update(GODZILLA_ENTER_SECONDS, true);
    actor.update(0, false);
    actor.update(GODZILLA_LEAVE_SECONDS, false);

    actor.update(0, true);

    expect(actor.phase).toBe('entering');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not appear when the regime ended while the model was loading', async () => {
    const actor = new GodzillaActor(stubLoader(), false);
    actor.update(0, true);
    actor.update(0, false);
    await flush();
    actor.update(0, false);

    expect(actor.phase).toBe('absent');
    expect(actor.root.visible).toBe(false);
  });

  it('skips walking under reduced motion', async () => {
    const actor = new GodzillaActor(stubLoader(), true);
    await summon(actor);

    expect(actor.phase).toBe('present');
    expect(distance(actor.root.position)).toBeCloseTo(GODZILLA_STAND_DISTANCE, 5);

    actor.update(0.1, false);
    expect(actor.phase).toBe('absent');
    expect(actor.root.visible).toBe(false);
  });

  it('stays absent without throwing when the load is rejected, warning once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const loader = vi.fn<GodzillaLoader>().mockRejectedValue(new Error('404'));
    const actor = new GodzillaActor(loader, false);

    actor.update(0, true);
    await flush();
    actor.update(1, true);
    actor.update(1, true);

    expect(actor.phase).toBe('absent');
    expect(actor.root.visible).toBe(false);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('releases the model on dispose and detaches from the scene', async () => {
    const scene = new THREE.Scene();
    const actor = new GodzillaActor(stubLoader(), false);
    scene.add(actor.root);
    await summon(actor);
    const holder = actor.root.children[0];
    const mesh = holder.children[0].children[0] as THREE.Mesh;
    const disposeGeometry = vi.spyOn(mesh.geometry, 'dispose');

    actor.dispose();
    actor.update(1, true);

    expect(disposeGeometry).toHaveBeenCalled();
    expect(actor.root.parent).toBeNull();
  });
});
