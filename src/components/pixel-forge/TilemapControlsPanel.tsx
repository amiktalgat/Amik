import { tileSizes, type TileLayer, type TilemapTool, type TileSize } from '../../lib/tilemap';
import { TilemapLayersPanel } from './TilemapLayersPanel';
import { TilemapPalette } from './TilemapPalette';

type TilemapControlsPanelProps = {
  activeLayerId: string;
  activeLayerName: string;
  layers: TileLayer[];
  mapHeight: number;
  mapWidth: number;
  selectedTileId: number;
  tileSize: TileSize;
  tool: TilemapTool;
  toolLabels: Record<TilemapTool, string>;
  tools: TilemapTool[];
  onActiveLayerChange: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onMoveLayer: (layerId: string, direction: -1 | 1) => void;
  onSelectTile: (tileId: number) => void;
  onTileSizeChange: (size: TileSize) => void;
  onToggleLayer: (layerId: string) => void;
  onToolChange: (tool: TilemapTool) => void;
};

export function TilemapControlsPanel({
  activeLayerId,
  activeLayerName,
  layers,
  mapHeight,
  mapWidth,
  selectedTileId,
  tileSize,
  tool,
  toolLabels,
  tools,
  onActiveLayerChange,
  onAddLayer,
  onDeleteLayer,
  onExportJson,
  onExportPng,
  onMoveLayer,
  onSelectTile,
  onTileSizeChange,
  onToggleLayer,
  onToolChange,
}: TilemapControlsPanelProps) {
  return (
    <aside className="pf-sidebar pf-rightPanel">
      <section className="pf-controls">
        <h2>Tile Size</h2>
        <div className="pf-segmentedButtons">
          {tileSizes.map((size) => (
            <button className={tileSize === size ? 'active' : ''} key={size} onClick={() => onTileSizeChange(size)}>
              {size}x{size}
            </button>
          ))}
        </div>
      </section>
      <TilemapPalette selectedTileId={selectedTileId} tileSize={tileSize} onSelectTile={onSelectTile} />
      <section className="pf-controls">
        <h2>Tools</h2>
        <div className="pf-toolGrid">
          {tools.map((item) => (
            <button className={`pf-tool ${tool === item ? 'active' : ''}`} key={item} onClick={() => onToolChange(item)}>
              {toolLabels[item]}
            </button>
          ))}
        </div>
      </section>
      <TilemapLayersPanel
        activeLayerId={activeLayerId}
        layers={layers}
        onActiveLayerChange={onActiveLayerChange}
        onAddLayer={onAddLayer}
        onDeleteLayer={onDeleteLayer}
        onMoveLayer={onMoveLayer}
        onToggleLayer={onToggleLayer}
      />
      <section className="pf-controls">
        <h2>Export</h2>
        <span className="pf-exportSize">{mapWidth} x {mapHeight} tiles | layer: {activeLayerName}</span>
        <div className="pf-generatorActions">
          <button className="pf-primary" onClick={onExportJson}>Download JSON</button>
          <button onClick={onExportPng}>Download PNG</button>
        </div>
      </section>
    </aside>
  );
}
