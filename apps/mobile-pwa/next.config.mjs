/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@kynovia/access-engine",
    "@kynovia/auth",
    "@kynovia/database",
    "@kynovia/ui"
  ]
};

export default nextConfig;
