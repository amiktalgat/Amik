import { useMemo, useState } from 'react';
import {
  exportTilemapJson,
  makeDefaultLayers,
  makeLayer,
  makeStarterLayers,
  renderTilemapToCanvas,
  tileSizes,
  type TileLayer,
  type TilemapTool,
  type TileSize,
} from '../../lib/tilemap';
import { downloadPng } from '../../lib/pixelExport';
import { TilemapCanvas } from './TilemapCanvas';
import { TilemapLayersPanel } from './TilemapLayersPanel';
import { TilemapPalette } from './TilemapPalette';

type TilemapEditorProps = {
  onStatus: (status: string) => void;
};

const tools: TilemapTool[] = ['pencil', 'eraser', 'fill', 'eyedropper', 'rectangle'];
const toolLabels: Record<TilemapTool, string> = {
  pencil: 'Кисть',
  eraser: 'Ластик',
  fill: 'Заливка',
  eyedropper: 'Пипетка',
  rectangle: 'Прямоугольник',
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
      <aside className="pf-sidebar pf-leftPanel">
        <section className="pf-sectionCard">
          <h3>Как делать карту</h3>
          <p>1. Выбери тайл. 2. Выбери инструмент. 3. Рисуй по клеткам. JSON нужен для игры, PNG - как картинка.</p>
        </section>
        <section className="pf-sectionCard">
          <h3>Сейчас</h3>
          <p>{mapWidth} x {mapHeight} клеток, активный слой: {activeLayerName}. Размер тайла: {tileSize}px.</p>
        </section>
        <section className="pf-sectionCard">
          <h3>Быстрые действия</h3>
          <div className="pf-generatorActions">
            <button className="pf-primary" onClick={showStarterMap}>Пример карты</button>
            <button onClick={clearMap}>Очистить карту</button>
          </div>
        </section>
      </aside>
      <main className="pf-workspace pf-tilemapWorkspace">
        <TilemapCanvas
          activeLayerId={activeLayerId}
          height={mapHeight}
          layers={layers}
          selectedTileId={selectedTileId}
          tileSize={tileSize}
          tool={tool}
          width={mapWidth}
          onEyedrop={setSelectedTileId}
          onLayersChange={setLayers}
          onStatus={onStatus}
        />
      </main>
      <aside className="pf-sidebar pf-rightPanel">
        <section className="pf-controls">
          <h2>Tile Size</h2>
          <div className="pf-segmentedButtons">
            {tileSizes.map((size) => (
              <button className={tileSize === size ? 'active' : ''} key={size} onClick={() => setTileSize(size)}>
                {size}x{size}
              </button>
            ))}
          </div>
        </section>
        <TilemapPalette selectedTileId={selectedTileId} tileSize={tileSize} onSelectTile={setSelectedTileId} />
        <section className="pf-controls">
          <h2>Инструменты</h2>
          <div className="pf-toolGrid">
            {tools.map((item) => (
              <button className={`pf-tool ${tool === item ? 'active' : ''}`} key={item} onClick={() => setTool(item)}>
                {toolLabels[item]}
              </button>
            ))}
          </div>
        </section>
        <TilemapLayersPanel
          activeLayerId={activeLayerId}
          layers={layers}
          onActiveLayerChange={chooseLayer}
          onAddLayer={addLayer}
          onDeleteLayer={deleteLayer}
          onMoveLayer={moveLayer}
          onToggleLayer={toggleLayer}
        />
        <section className="pf-controls">
          <h2>Экспорт</h2>
          <span className="pf-exportSize">{mapWidth} x {mapHeight} тайлов | слой: {activeLayerName}</span>
          <div className="pf-generatorActions">
            <button className="pf-primary" onClick={exportJson}>Скачать JSON</button>
            <button onClick={exportPng}>Скачать PNG</button>
          </div>
        </section>
      </aside>
    </>
  );
}
