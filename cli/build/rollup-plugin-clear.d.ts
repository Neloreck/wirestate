declare module "rollup-plugin-clear" {
  import { type Plugin } from "rollup";

  const clear: (options: { targets: Array<string>; watch?: boolean }) => Plugin;
  export default clear;
}
