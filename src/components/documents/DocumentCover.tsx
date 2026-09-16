type DocumentCoverProps = {
  alt: string;
  src: string | null;
};

export default function DocumentCover({ alt, src }: DocumentCoverProps) {
  return (
    <div className={`document-cover${src ? '' : ' is-empty'}`}>
      {src ? <img alt={alt} draggable={false} src={src} /> : null}
    </div>
  );
}
