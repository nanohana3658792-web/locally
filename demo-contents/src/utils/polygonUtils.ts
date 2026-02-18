import type { LatLng } from '../types'

export const isPointInPolygon = (point: LatLng, polygon: LatLng[]): boolean => {
  let isInside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi

    if (intersect) isInside = !isInside
  }
  return isInside
}

export const roughDistanceMeters = (a: LatLng, b: LatLng): number => {
  const latM = (a.lat - b.lat) * 111_000
  const lngM = (a.lng - b.lng) * 91_000
  return Math.sqrt(latM * latM + lngM * lngM)
}
