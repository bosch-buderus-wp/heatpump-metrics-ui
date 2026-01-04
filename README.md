# Heatpump Metrics

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://github.com/bosch-buderus-wp/heatpump-metrics-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A community-driven platform for visualizing and analyzing heat pump efficiency metrics. Track your heat pump's performance, compare with others, and contribute to a growing dataset of real-world heat pump performance data.

## 🌟 Features

### 📊 Public Statistics (No Registration Required)

- **Monthly Performance Metrics**

  - View aggregated monthly data for all heat pumps
  - Calculate Coefficient of Performance (COP/Arbeitszahl)
  - Filter by month/year
  - Compare performance across different systems

- **Daily Measurements**

  - Hourly measurement data
  - Real-time performance tracking
  - Detailed energy consumption analysis

- **System Overview**
  - Browse all registered heat pump systems
  - Filter by type, location, and specifications
  - Compare different configurations

### 🔐 User Features (Registration Required)

- **Personal Dashboard**

  - Add and manage your heat pump system(s)
  - Upload hourly measurements via API
  - Track monthly performance metrics
  - Personal API key for automated data uploads

- **Data Management**
  - Add/edit/delete heating systems
  - Manage monthly values
  - Data export capabilities

### 🌍 Internationalization

- **Multi-language Support**
  - German (default)
  - English
  - Easy to add more languages

## 🚀 Quick Start

### For End Users

Visit the live application: [Heatpump Metrics](https://bosch-buderus-wp.github.io/metrics)

### For Developers

```bash
# Clone the repository
git clone https://github.com/bosch-buderus-wp/heatpump-metrics-ui.git
cd heatpump-metrics-ui

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.development
# Edit .env.development with your Supabase credentials

# Start development server
npm run dev
```

**📖 Detailed setup:** See [DEVELOPMENT.md](DEVELOPMENT.md)

## 🏗️ Technology Stack

- **Frontend:** React 19 + TypeScript
- **UI Library:** Material-UI (MUI)
- **Charts:** Nivo
- **Backend:** Supabase (PostgreSQL + Auth + APIs)
- **Build Tool:** Vite 7
- **State Management:** TanStack Query
- **Routing:** React Router 7
- **i18n:** i18next

## 📁 Project Structure

```
metrics/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components (routes)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and helpers
│   └── types/           # TypeScript definitions
├── CONTRIBUTING.md      # Contribution guidelines
├── DEVELOPMENT.md       # Development setup & workflow
├── ARCHITECTURE.md      # Technical architecture
└── README.md            # This file
```

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or adding translations - every contribution matters.

**Get Started:**

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
2. Check [DEVELOPMENT.md](DEVELOPMENT.md) for setup
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details

### Ways to Contribute

- 🐛 **Report bugs** - Help us improve quality
- 💡 **Suggest features** - Share your ideas
- 🌍 **Add translations** - Make it accessible worldwide
- 📝 **Improve docs** - Help others understand
- 💻 **Submit code** - Fix bugs or add features
- 🧪 **Write tests** - Increase reliability

## 📊 Database

The database schema is maintained separately:

- **Repository:** [heatpump-metrics-db](https://github.com/bosch-buderus-wp/heatpump-metrics-db)
- **Platform:** Supabase (PostgreSQL)
- **Security:** Row Level Security (RLS) enabled

### Key Tables

- `users` - User profiles
- `heating_systems` - Heat pump configurations
- `monthly_values` - Monthly aggregated metrics
- `measurements` - Hourly measurement data

## 🔐 Authentication

- Supabase Authentication
- Magic link (passwordless) login
- Secure session management

## 🌐 Deployment

This application is built for CDN distribution via jsDelivr:

```html
<!-- Embed in any website -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/bosch-buderus-wp/heatpump-metrics-ui@v1.0.2-release/app.css"
/>
<div id="root"></div>
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/bosch-buderus-wp/heatpump-metrics-ui@v1.0.2-release/app.js"
></script>
```

Or use `@release` to always get the latest version:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/bosch-buderus-wp/heatpump-metrics-ui@release/app.css"
/>
<div id="root"></div>
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/bosch-buderus-wp/heatpump-metrics-ui@release/app.js"
></script>
```

### Build for Production

```bash
npm run build        # Builds to production
npm run build:dev    # Builds for development
```

Output: Single-file bundle (`app.js` + `app.css`) optimized for CDN distribution.

## 📈 Roadmap

### Planned Features

- [ ] Allow users to filter for similar heating_systems
- [ ] Average/min/max temperature from weather APIs
- [ ] Standard outdoor temperature (NAT) from waermepumpe.de

## 🐛 Known Issues

Check our [Issues](https://github.com/bosch-buderus-wp/heatpump-metrics-ui/issues) page for known bugs and feature requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All contributors who have helped build this platform
- The heat pump community for sharing their data
- Supabase for the amazing backend platform
- Open source libraries that power this project
- Great LLMs from Anthropic and OpenAI which created ~90% of this project

## 📞 Support & Community

- **Issues:** [GitHub Issues](https://github.com/bosch-buderus-wp/heatpump-metrics-ui/issues)
- **Discussions:** [GitHub Discussions](https://github.com/bosch-buderus-wp/heatpump-metrics-ui/discussions)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)

## 📚 Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development setup and workflow
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture details

## 🔗 Related Projects

- [heatpump-metrics-db](https://github.com/bosch-buderus-wp/heatpump-metrics-db) - Database schema and setup

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ by the heat pump community**
