import manifest from "../../public/data/imagery-manifest.json";
/** All image edges coincide with first/last terrain vertex centres (north-up). */
export const IMAGERY_VIEWS = manifest;
export type ImageryView = (typeof IMAGERY_VIEWS)[number];
export const IMAGERY_REGISTRATION_STATUS = "Source CRS registration; independent ground-control alignment has not been verified.";
