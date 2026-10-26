import { Composition, staticFile } from "remotion";
import { Video, FPS, type Props } from "./Video";

// Proje adı --props ile verilir: kes.mjs ve ekran.mjs çıktıları public/<proje>/ altında.
export const Root = () => (
  <Composition
    id="Video"
    component={Video}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={1}
    defaultProps={{ proje: "yatirimci-yok-mu" } as Props}
    calculateMetadata={async ({ props }) => {
      const kurgu = await fetch(staticFile(`${props.proje}/kurgu.json`)).then((r) => r.json());
      const boylar = await fetch(staticFile(`${props.proje}/ekran.json`)).then((r) => (r.ok ? r.json() : {}));
      return {
        durationInFrames: Math.ceil((kurgu.sure + kurgu.kuyruk) * FPS),
        props: { ...props, kurgu, boylar },
      };
    }}
  />
);
