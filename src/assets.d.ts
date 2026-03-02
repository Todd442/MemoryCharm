// Uppercase image extensions — cameras like iPhone export .JPG
// vite/client only declares lowercase variants; this covers the gap.
declare module "*.JPG" {
  const src: string;
  export default src;
}
declare module "*.PNG" {
  const src: string;
  export default src;
}
declare module "*.JPEG" {
  const src: string;
  export default src;
}
declare module "*.HEIC" {
  const src: string;
  export default src;
}
