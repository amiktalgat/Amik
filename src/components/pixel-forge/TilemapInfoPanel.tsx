type TilemapInfoPanelProps = {
  activeLayerName: string;
  mapHeight: number;
  mapWidth: number;
  tileSize: number;
  onClearMap: () => void;
  onStarterMap: () => void;
};

export function TilemapInfoPanel({
  activeLayerName,
  mapHeight,
  mapWidth,
  tileSize,
  onClearMap,
  onStarterMap,
}: TilemapInfoPanelProps) {
  return (
    <aside className="pf-sidebar pf-leftPanel">
      <section className="pf-sectionCard">
        <h3>How to build a map</h3>
        <p>Pick a tile, choose a tool, then draw on the grid. Export JSON for games or PNG as an image.</p>
      </section>
      <section className="pf-sectionCard">
        <h3>Map status</h3>
        <p>{mapWidth} x {mapHeight} cells, active layer: {activeLayerName}. Tile size: {tileSize}px.</p>
      </section>
      <section className="pf-sectionCard">
        <h3>Quick actions</h3>
        <div className="pf-generatorActions">
          <button className="pf-primary" onClick={onStarterMap}>Load starter map</button>
          <button onClick={onClearMap}>Clear map</button>
        </div>
      </section>
    </aside>
  );
}
