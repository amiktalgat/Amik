import type { TileLayer } from '../../lib/tilemap';

type TilemapLayersPanelProps = {
  activeLayerId: string;
  layers: TileLayer[];
  onActiveLayerChange: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: -1 | 1) => void;
  onToggleLayer: (layerId: string) => void;
};

export function TilemapLayersPanel({
  activeLayerId,
  layers,
  onActiveLayerChange,
  onAddLayer,
  onDeleteLayer,
  onMoveLayer,
  onToggleLayer,
}: TilemapLayersPanelProps) {
  return (
    <section className="pf-controls">
      <div className="pf-layerHeader">
        <h2>Layers</h2>
        <button className="small" onClick={onAddLayer}>Add</button>
      </div>
      <div className="pf-layerList">
        {layers.map((layer, index) => (
          <div className={`pf-layerItem ${activeLayerId === layer.id ? 'active' : ''}`} key={layer.id}>
            <button className="pf-layerName" onClick={() => onActiveLayerChange(layer.id)}>
              {layer.name}
            </button>
            <button title="Hide or show layer" onClick={() => onToggleLayer(layer.id)}>
              {layer.isVisible ? 'Hide' : 'Show'}
            </button>
            <button disabled={index === 0} title="Move layer down" onClick={() => onMoveLayer(layer.id, -1)}>
              Down
            </button>
            <button disabled={index === layers.length - 1} title="Move layer up" onClick={() => onMoveLayer(layer.id, 1)}>
              Up
            </button>
            <button disabled={layers.length <= 1} title="Delete layer" onClick={() => onDeleteLayer(layer.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
