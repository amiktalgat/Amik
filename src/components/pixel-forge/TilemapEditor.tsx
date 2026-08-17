import { useMemo, useState } from 'react';
import { downloadPng } from '../../lib/pixelExport';
import {
  exportTilemapJson,
  makeDefaultLayers,
  makeLayer,
  makeStarterLayers,
  renderTilemapToCanvas,
  type TileLayer,
  type TilemapTool,
  type TileSize,
} from '../../lib/tilemap';
import { TilemapCanvas } from './TilemapCanvas';
import { TilemapControlsPanel } from './TilemapControlsPanel';
import { TilemapInfoPanel } from './TilemapInfoPanel';

type TilemapEditorProps = {
  onStatus: (status: string) => void;
};

const tools: TilemapTool[] = ['pencil', 'eraser', 'fill', 'eyedropper', 'rectangle'];
const toolLabels: Record<TilemapTool, string> = {
  pencil: 'Pencil',
  eraser: 'Eraser',
  fill: 'Fill',
  eyedropper: 'Picker',
  rectangle: 'Rectangle',
};
const mapWidth = 24;
const mapHeight = 16;

export function TilemapEditor({ onStatus }: TilemapEditorProps) {
  const [tileSize, setTileSize] = useState<TileSize>(16);
  const [tool, setTool] = useState<TilemapTool>('pencil');
  const [selectedTileId, setSelectedTileId] = useState(0);
  const [layers, setLayers] = useState<TileLayer[]>(() => makeStarterLayers(mapWidth, mapHeight));
  const [activeLayerId, setActiveLayerId] = useState(() => layers[1]?.id ?? layers[0].id);

  const activeLayerName = useMemo(
    () => layers.find((layer) => layer.id === activeLayerId)?.name ?? 'Layer',
    [activeLayerId, layers],
  );

  const addLayer = () => {
    const nextLayer = makeLayer(`Layer ${layers.length + 1}`, mapWidth, mapHeight);
    setLayers((current) => [...current, nextLayer]);
    setActiveLayerId(nextLayer.id);
    onStatus('Layer created');
  };

  const showStarterMap = () => {
    const nextLayers = makeStarterLayers(mapWidth, mapHeight);
    setLayers(nextLayers);
    setActiveLayerId(nextLayers[1]?.id ?? nextLayers[0].id);
    onStatus('Starter map loaded');
  };

  const clearMap = () => {
    const nextLayers = makeDefaultLayers(mapWidth, mapHeight);
    setLayers(nextLayers);
    setActiveLayerId(nextLayers[1]?.id ?? nextLayers[0].id);
    onStatus('Tilemap cleared');
  };

  const deleteLayer = (layerId: string) => {
    if (layers.length <= 1) return;
    const nextLayers = layers.filter((layer) => layer.id !== layerId);
    setLayers(nextLayers);
    if (activeLayerId === layerId) setActiveLayerId(nextLayers[Math.max(0, nextLayers.length - 1)].id);
    onStatus('Layer deleted');
  };

  const toggleLayer = (layerId: string) => {
    setLayers((current) => current.map((layer) => (
      layer.id === layerId ? { ...layer, isVisible: !layer.isVisible } : layer
    )));
    onStatus('Layer visibility changed');
  };

  const chooseLayer = (layerId: string) => {
    setActiveLayerId(layerId);
    setLayers((current) => current.map((layer) => (
      layer.id === layerId ? { ...layer, isVisible: true } : layer
    )));
    onStatus('Active layer selected');
  };

  const moveLayer = (layerId: string, direction: -1 | 1) => {
    const index = layers.findIndex((layer) => layer.id === layerId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= layers.length) return;
    const nextLayers = [...layers];
    [nextLayers[index], nextLayers[nextIndex]] = [nextLayers[nextIndex], nextLayers[index]];
    setLayers(nextLayers);
    onStatus('Layer order changed');
  };

  const exportJson = () => {
    const data = exportTilemapJson(mapWidth, mapHeight, tileSize, layers);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'pixelforge-tilemap.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    onStatus('Tilemap JSON exported');
  };

  const exportPng = () => {
    const canvas = document.createElement('canvas');
    if (!renderTilemapToCanvas(canvas, mapWidth, mapHeight, tileSize, layers)) return;
    downloadPng(canvas, 'pixelforge-tilemap.png');
    onStatus('Tilemap PNG exported');
  };

  return (
    <>
      <TilemapInfoPanel
        activeLayerName={activeLayerName} mapHeight={mapHeight} mapWidth={mapWidth}
        tileSize={tileSize} onClearMap={clearMap} onStarterMap={showStarterMap}
      />
      <main className="pf-workspace pf-tilemapWorkspace">
        <TilemapCanvas
          activeLayerId={activeLayerId} height={mapHeight} layers={layers}
          selectedTileId={selectedTileId} tileSize={tileSize} tool={tool} width={mapWidth}
          onEyedrop={setSelectedTileId} onLayersChange={setLayers} onStatus={onStatus}
        />
      </main>
      <TilemapControlsPanel
        activeLayerId={activeLayerId} activeLayerName={activeLayerName} layers={layers}
        mapHeight={mapHeight} mapWidth={mapWidth} selectedTileId={selectedTileId}
        tileSize={tileSize} tool={tool} toolLabels={toolLabels} tools={tools}
        onActiveLayerChange={chooseLayer} onAddLayer={addLayer} onDeleteLayer={deleteLayer}
        onExportJson={exportJson} onExportPng={exportPng} onMoveLayer={moveLayer}
        onSelectTile={setSelectedTileId} onTileSizeChange={setTileSize}
        onToggleLayer={toggleLayer} onToolChange={setTool}
      />
    </>
  );
}
