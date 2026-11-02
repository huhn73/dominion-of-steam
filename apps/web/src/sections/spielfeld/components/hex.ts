// Regeln und Hex-Geometrie liegen in packages/shared, damit Vorschau und Server denselben Code nutzen
export * from '@dos/shared/game/hex'
// Kompakte Karte: ein Zeichen je Feld für Gelände und Sicht
export { packMap, terrainAt, tileIndex, visibilityAt } from '@dos/shared/game/mapcodec'
