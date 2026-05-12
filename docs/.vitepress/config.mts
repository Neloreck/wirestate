import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/wirestate/",
  title: "Wirestate",
  description: "State management framework based on InversifyJS",
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/wirestate/logo.svg" }]],
  async transformPageData(pageData) {
    if (pageData.relativePath.startsWith("api/wirestate-")) {
      pageData.frontmatter.prev = false;
      pageData.frontmatter.next = false;
    }
  },
  themeConfig: {
    logo: "/logo.svg",
    outline: [2, 3],
    nav: [
      { text: "Home", link: "/" },
      { text: "Introduction", link: "/introduction/about" },
      { text: "Guide", link: "/guide/services" },
      { text: "API", link: "/api/" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "About", link: "/introduction/about" },
          { text: "Installation", link: "/introduction/installation" },
          { text: "React/Signals", link: "/introduction/react-signals" },
          { text: "React/MobX", link: "/introduction/react-mobx" },
          { text: "Lit/Signals", link: "/introduction/lit-signals" },
        ],
      },
      {
        text: "Guide",
        items: [
          { text: "Services", link: "/guide/services" },
          { text: "Messaging", link: "/guide/messaging" },
          { text: "Containers", link: "/guide/containers" },
          { text: "Seeds", link: "/guide/seeds" },
          { text: "Testing", link: "/guide/testing" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "Overview", link: "/api/" },
          { text: "Modules", link: "/api/modules" },
          {
            text: "Packages",
            items: [
              { text: "@wirestate/core", link: "/api/wirestate-core/" },
              { text: "@wirestate/core/test-utils", link: "/api/wirestate-core/test-utils/" },
              { text: "@wirestate/lit", link: "/api/wirestate-lit/" },
              { text: "@wirestate/lit/test-utils", link: "/api/wirestate-lit/test-utils/" },
              { text: "@wirestate/lit-signals", link: "/api/wirestate-lit-signals/" },
              { text: "@wirestate/react", link: "/api/wirestate-react/" },
              { text: "@wirestate/react/test-utils", link: "/api/wirestate-react/test-utils/" },
              { text: "@wirestate/react-mobx", link: "/api/wirestate-react-mobx/" },
              { text: "@wirestate/react-signals", link: "/api/wirestate-react-signals/" },
            ],
          },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/Neloreck/wirestate" }],
  },
});
