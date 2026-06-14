const BOOT_LINES = [
  'Stacking fresh paper',
  'Sharpening the margins',
  'Finding your last page',
  'Letting the ink settle',
];

function bootLine() {
  return BOOT_LINES[new Date().getSeconds() % BOOT_LINES.length];
}

export default function BootScreen() {
  return (
    <main className="boot-screen" aria-busy="true" aria-label="Opening Loci">
      <div className="boot-screen-copy">
        <span>{bootLine()}</span>
        <div className="boot-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}
