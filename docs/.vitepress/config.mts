import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/wirestate/',
  title: "Wirestate",
  description: "State management framework based on InversifyJS",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/intro' },
      { text: 'API', link: '/api/' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/intro' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Overview', link: '/api/' },
          { text: 'Modules', link: '/api/modules' },
          {
            text: 'Packages',
            items: [
              { text: 'Core', link: '/api/wirestate-core/' },
              { text: 'Lit', link: '/api/wirestate-lit/' },
              { text: 'Lit Signals', link: '/api/wirestate-lit-signals/' },
              { text: 'React', link: '/api/wirestate-react/' },
              { text: 'React MobX', link: '/api/wirestate-react-mobx/' },
              { text: 'React Signals', link: '/api/wirestate-react-signals/' }
            ]
          }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Neloreck/wirestate' }
    ]
  }
})
