import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/wirestate/",
  title: "Wirestate",
  description: "State management framework based on InversifyJS",
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
      { text: "Guide", link: "/intro" },
      { text: "API", link: "/api/" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [{ text: "Introduction", link: "/intro" }],
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
