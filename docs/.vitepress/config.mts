import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/wirestate/",
  title: "Wirestate",
  description: "Dependency-injected service state for React and Lit applications",
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/wirestate/logo.svg" }]],
  markdown: {
    theme: { light: "github-light", dark: "night-owl" },
  },
  async transformPageData(pageData) {
    if (pageData.relativePath.startsWith("api/")) {
      pageData.frontmatter.pageClass = "api-reference";
    }

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
      { text: "Core", link: "/core/overview" },
      { text: "React", link: "/react/overview" },
      { text: "Lit", link: "/lit/overview" },
      {
        text: "Reactivity",
        items: [
          { text: "React Signals", link: "/react-signals/overview" },
          { text: "React MobX", link: "/react-mobx/overview" },
          { text: "Lit Signals", link: "/lit-signals/overview" },
          { text: "Lit MobX", link: "/lit-mobx/overview" },
        ],
      },
      { text: "API", link: "/api/" },
      { text: "Changelog", link: "/changelog" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "About", link: "/introduction/about" },
          { text: "Installation", link: "/introduction/installation" },
          { text: "React Signals", link: "/introduction/react-signals" },
          { text: "React MobX", link: "/introduction/react-mobx" },
          { text: "Lit Signals", link: "/introduction/lit-signals" },
          { text: "Lit MobX", link: "/introduction/lit-mobx" },
        ],
      },
      {
        text: "Core",
        items: [
          { text: "Overview", link: "/core/overview" },
          { text: "Services", link: "/core/services" },
          { text: "Containers", link: "/core/containers" },
          { text: "Lifecycle", link: "/core/lifecycle" },
          { text: "Events", link: "/core/events" },
          { text: "Commands", link: "/core/commands" },
          { text: "Queries", link: "/core/queries" },
          { text: "Plugins", link: "/core/plugins" },
          { text: "Testing", link: "/core/testing" },
        ],
      },
      {
        text: "React",
        items: [
          { text: "Overview", link: "/react/overview" },
          { text: "Containers", link: "/react/containers" },
          { text: "Injection", link: "/react/injection" },
          { text: "Events", link: "/react/events" },
          { text: "Commands", link: "/react/commands" },
          { text: "Queries", link: "/react/queries" },
          { text: "Testing", link: "/react/testing" },
        ],
      },
      {
        text: "React Signals",
        items: [{ text: "Overview", link: "/react-signals/overview" }],
      },
      {
        text: "React MobX",
        items: [{ text: "Overview", link: "/react-mobx/overview" }],
      },
      {
        text: "Lit",
        items: [
          { text: "Overview", link: "/lit/overview" },
          { text: "Containers", link: "/lit/containers" },
          { text: "Injection", link: "/lit/injection" },
          { text: "Events", link: "/lit/events" },
          { text: "Commands", link: "/lit/commands" },
          { text: "Queries", link: "/lit/queries" },
          { text: "Testing", link: "/lit/testing" },
        ],
      },
      {
        text: "Lit Signals",
        items: [{ text: "Overview", link: "/lit-signals/overview" }],
      },
      {
        text: "Lit MobX",
        items: [{ text: "Overview", link: "/lit-mobx/overview" }],
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
              { text: "@wirestate/mobx", link: "/api/wirestate-mobx/" },
              { text: "@wirestate/signals", link: "/api/wirestate-signals/" },
              { text: "@wirestate/lit", link: "/api/wirestate-lit/" },
              { text: "@wirestate/lit-mobx", link: "/api/wirestate-lit-mobx/" },
              { text: "@wirestate/lit-signals", link: "/api/wirestate-lit-signals/" },
              { text: "@wirestate/react", link: "/api/wirestate-react/" },
              { text: "@wirestate/react-mobx", link: "/api/wirestate-react-mobx/" },
              { text: "@wirestate/react-signals", link: "/api/wirestate-react-signals/" },
            ],
          },
        ],
      },
      {
        text: "Releases",
        items: [{ text: "Changelog", link: "/changelog" }],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/Neloreck/wirestate" }],
  },
});
