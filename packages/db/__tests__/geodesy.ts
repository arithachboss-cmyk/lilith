/**
 * The distance between two points on the WGS 84 ellipsoid, in metres, by
 * Vincenty's inverse formula. The tests use it to check PostGIS with a
 * calculation that shares no code with it.
 */

export interface Position {
  readonly lat: number;
  readonly lng: number;
}

const SEMI_MAJOR = 6_378_137;
const FLATTENING = 1 / 298.257223563;
const SEMI_MINOR = SEMI_MAJOR * (1 - FLATTENING);

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

export function geodesicMeters(from: Position, to: Position): number {
  if (from.lat === to.lat && from.lng === to.lng) return 0;
  const reducedFrom = Math.atan((1 - FLATTENING) * Math.tan(radians(from.lat)));
  const reducedTo = Math.atan((1 - FLATTENING) * Math.tan(radians(to.lat)));
  const sinFrom = Math.sin(reducedFrom);
  const cosFrom = Math.cos(reducedFrom);
  const sinTo = Math.sin(reducedTo);
  const cosTo = Math.cos(reducedTo);
  const difference = radians(to.lng - from.lng);

  let lambda = difference;
  let sinSigma = 0;
  let cosSigma = 0;
  let sigma = 0;
  let cosSqAlpha = 0;
  let cos2SigmaM = 0;
  for (let round = 0; round < 200; round += 1) {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.hypot(
      cosTo * sinLambda,
      cosFrom * sinTo - sinFrom * cosTo * cosLambda,
    );
    cosSigma = sinFrom * sinTo + cosFrom * cosTo * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosFrom * cosTo * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM =
      cosSqAlpha === 0 ? 0 : cosSigma - (2 * sinFrom * sinTo) / cosSqAlpha;
    const c =
      (FLATTENING / 16) * cosSqAlpha * (4 + FLATTENING * (4 - 3 * cosSqAlpha));
    const next =
      difference +
      (1 - c) *
        FLATTENING *
        sinAlpha *
        (sigma +
          c *
            sinSigma *
            (cos2SigmaM + c * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    const settled = Math.abs(next - lambda) < 1e-12;
    lambda = next;
    if (settled) break;
  }

  const uSq =
    (cosSqAlpha * (SEMI_MAJOR * SEMI_MAJOR - SEMI_MINOR * SEMI_MINOR)) /
    (SEMI_MINOR * SEMI_MINOR);
  const a = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const b = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma =
    b *
    sinSigma *
    (cos2SigmaM +
      (b / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
          (b / 6) *
            cos2SigmaM *
            (-3 + 4 * sinSigma * sinSigma) *
            (-3 + 4 * cos2SigmaM * cos2SigmaM)));
  return SEMI_MINOR * a * (sigma - deltaSigma);
}
