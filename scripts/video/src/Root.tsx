import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { Video, FPS, type Props } from "./Video";
import { Kapak, Thumbnail } from "./Kapak";

// Proje adı --props ile verilir: kes.mjs ve ekran.mjs çıktıları public/<proje>/ altında.
const yukle: CalculateMetadataFunction<Props> = async ({ props }) => {
  const kurgu = await fetch(staticFile(`${props.proje}/kurgu.json`)).then((r) => r.json());
  const boylar = await fetch(staticFile(`${props.proje}/ekran.json`)).then((r) => (r.ok ? r.json() : {}));
  return {
    durationInFrames: Math.ceil((kurgu.sure + kurgu.kuyruk) * FPS),
    props: { ...props, kurgu, boylar },
  };
};

// Kapak/thumbnail tek karedir; aynı kurgu verisini kullanır.
const tekKare: CalculateMetadataFunction<Props> = async (a) => ({ ...(await yukle(a)), durationInFrames: 1 });

const varsayilan = { proje: "yatirimci-yok-mu" } as Props;

export const Root = () => (
  <>
    <Composition id="Video" component={Video} fps={FPS} width={1080} height={1920} durationInFrames={1} defaultProps={varsayilan} calculateMetadata={yukle} />
    <Composition id="Kapak" component={Kapak} fps={FPS} width={1080} height={1920} durationInFrames={1} defaultProps={varsayilan} calculateMetadata={tekKare} />
    <Composition id="Thumbnail" component={Thumbnail} fps={FPS} width={1280} height={720} durationInFrames={1} defaultProps={varsayilan} calculateMetadata={tekKare} />
  </>
);
