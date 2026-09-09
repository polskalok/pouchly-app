export type PickedCoords = { latitude: number; longitude: number };

type Listener = (coords: PickedCoords) => void;

let listener: Listener | null = null;

export function setLocationPickListener(cb: Listener | null): void {
  listener = cb;
}

export function emitLocationPick(coords: PickedCoords): void {
  listener?.(coords);
}
