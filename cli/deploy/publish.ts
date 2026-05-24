import { publishPackages, readPublishPackages, resolvePublishTag } from "./publish.utils";

if (require.main === module) {
  try {
    const tag = resolvePublishTag(process.argv.slice(2));
    const packages = readPublishPackages();

    publishPackages(packages, tag);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
