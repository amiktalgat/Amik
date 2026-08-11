import { ditheringOptions, type DitheringMode } from '../../lib/pixelPalette';

type DitheringSelectorProps = {
  value: DitheringMode;
  onChange: (mode: DitheringMode) => void;
};

export function DitheringSelector({ value, onChange }: DitheringSelectorProps) {
  return (
    <label>
      Dithering
      <select value={value} onChange={(event) => onChange(event.target.value as DitheringMode)}>
        {ditheringOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
