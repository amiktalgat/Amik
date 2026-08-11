const sections = [
  ['image', 'Original Image', 'Load PNG, JPG, JPEG, or WebP files without replacing the saved original.'],
  ['ai', 'AI Generate', 'Write a prompt, generate a real image through the backend, then use it as editable pixel art.'],
  ['resize', 'Resize', 'The canvas keeps the same proportions and fits large images before processing.'],
  ['pixelation', 'Pixelation', 'Pick a fixed block size and preview crisp nearest-neighbor pixels.'],
  ['colors', 'Color Reduction', 'Keep original colors or reduce the palette to a fixed color count.'],
  ['result', 'Pixel Art', 'Generate, reset, paint small fixes, then export the result as a PNG.'],
  ['animation', 'Animation', 'Create multiple frames, preview motion, use onion skin, and export a sequence or sprite sheet.'],
  ['tools', 'Tools', 'Paint, erase, sample colors, or pan the artwork inside the canvas.'],
] as const;

type PixelForgeLeftPanelProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
};

export function PixelForgeLeftPanel({ activeSection, onSectionChange }: PixelForgeLeftPanelProps) {
  const current = sections.find(([id]) => id === activeSection) ?? sections[0];

  return (
    <aside className="pf-sidebar pf-leftPanel">
      {sections.map(([id, label]) => (
        <button
          className={`pf-panelTab ${activeSection === id ? 'active' : ''}`}
          key={id}
          onClick={() => onSectionChange(id)}
        >
          {label}
        </button>
      ))}
      <div className="pf-sectionCard">
        <h3>{current[1]}</h3>
        <p>{current[2]}</p>
      </div>
    </aside>
  );
}
