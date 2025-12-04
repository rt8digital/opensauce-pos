<div align="center">

<img src="docs/logo.svg" alt="OpenSauce POS Logo" width="150" height="150">

<h1>🔥 OpenSauce P.O.S.</h1>

<p align="center">
  <strong>Modern, Offline-First Point of Sale System</strong><br>
  Built for retail stores, restaurants, and service businesses
</p>

<p align="center">
  <a href="https://test.pos.rt8.co.za"><strong>🚀 Live Demo</strong></a> •
  <a href="#-features"><strong>Features</strong></a> •
  <a href="#-installation"><strong>Installation</strong></a> •
  <a href="#-documentation"><strong>Docs</strong></a> •
  <a href="https://discord.gg/CJGGDMVjNP"><strong>Discord</strong></a>
</p>

<p align="center">
  <a href="https://github.com/rt8digital/opensauce-pos/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <a href="https://github.com/rt8digital/opensauce-pos/releases">
    <img src="https://img.shields.io/github/v/release/rt8digital/opensauce-pos?include_prereleases" alt="Release">
  </a>
  <a href="https://github.com/rt8digital/opensauce-pos/stargazers">
    <img src="https://img.shields.io/github/stars/rt8digital/opensauce-pos?style=social" alt="Stars">
  </a>
  <a href="https://github.com/rt8digital/opensauce-pos/network/members">
    <img src="https://img.shields.io/github/forks/rt8digital/opensauce-pos?style=social" alt="Forks">
  </a>
  <a href="https://discord.gg/CJGGDMVjNP">
    <img src="https://img.shields.io/discord/YOUR_DISCORD_ID?color=7289da&label=Discord&logo=discord&logoColor=white" alt="Discord">
  </a>
</p>

</div>

---

## 📸 Screenshots

<div align="center">

### 💰 Point of Sale Interface
![POS Interface](docs/marketing-assets/pos-main-interface.png)

### 📊 Sales Dashboard
![Sales Dashboard](docs/marketing-assets/sales-page.png)

### 📦 Inventory Management
![Inventory](docs/marketing-assets/inventory-page.png)

<details>
<summary><strong>View More Screenshots</strong></summary>

### 👥 Customer Management
![Customers](docs/marketing-assets/customers-page.png)

### 🎁 Discounts & Promotions
![Discounts](docs/marketing-assets/discounts-page.png)

### ⚙️ Settings & Configuration
![Settings](docs/marketing-assets/settings-page.png)

</details>

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 💰 **Modern POS Interface**
- Fast product selection with visual grid
- Real-time cart management
- Multiple payment methods
- Instant receipt generation
- Keyboard shortcuts (F1-F12)
- Numpad optimization

### 📦 **Inventory Management**
- Real-time stock tracking
- Category organization
- Emoji/icon product representation
- Barcode & PLU support
- Quick search & filtering
- Bulk operations

### 👥 **Customer Management**
- Comprehensive profiles
- Purchase history tracking
- WhatsApp integration
- Phone validation
- Loyalty tracking
- Quick lookup

</td>
<td width="50%">

### 📊 **Sales Analytics**
- Real-time dashboards
- Interactive charts
- Transaction history
- Date range analysis
- Revenue tracking
- Export capabilities

### 🔌 **Hardware Integration**
- Receipt printers (USB/Network/Bluetooth)
- Barcode scanners
- Cash drawers
- Customer displays
- Scales
- Camera scanning

### 🌐 **Multi-Platform**
- **Desktop**: Windows, macOS, Linux (Electron)
- **Mobile**: Android, iOS (Capacitor)
- **Web**: Progressive Web App
- Responsive design

</td>
</tr>
</table>

### 🎯 **Key Highlights**

- ✅ **Offline-First** - Full functionality without internet
- ✅ **No Subscription Fees** - One-time setup, no recurring costs
- ✅ **Open Source** - MIT License, full transparency
- ✅ **Self-Hosted** - Complete control over your data
- ✅ **Multi-Language** - Built-in translation support
- ✅ **Receipt Customization** - Live preview editor
- ✅ **WhatsApp Integration** - Direct customer communication
- ✅ **Bluetooth Support** - Wireless peripheral connections

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/rt8digital/opensauce-pos.git
cd opensauce-pos

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5177`

### 🎮 Try the Live Demo

Visit **[test.pos.rt8.co.za](https://test.pos.rt8.co.za)** to try OpenSauce POS without installation!

**Default PIN**: `123456`

---

## 📦 Installation

<details>
<summary><strong>Desktop Application (Electron)</strong></summary>

### Development

```bash
npm run electron-dev
```

This starts both the server and Electron app in development mode.

### Building for Production

```bash
npm run electron-dist
```

Creates distributable packages for Windows, macOS, and Linux in the `dist-electron` folder.

### Platform-Specific Builds

```bash
# Windows
npm run electron-dist -- --win

# macOS
npm run electron-dist -- --mac

# Linux
npm run electron-dist -- --linux
```

</details>

<details>
<summary><strong>Mobile Application (Capacitor)</strong></summary>

### Setup

First, initialize Capacitor (only needed once):

```bash
npm run capacitor-init
```

Add platforms:

```bash
# Android
npm run capacitor-add-android

# iOS (macOS only)
npm run capacitor-add-ios
```

### Development

```bash
npm run capacitor-dev
```

### Building for Mobile

```bash
# Build web assets and sync to platforms
npm run capacitor-build

# Open in Android Studio
npm run capacitor-build-android

# Open in Xcode (macOS only)
npm run capacitor-build-ios
```

</details>

<details>
<summary><strong>Web Application (PWA)</strong></summary>

### Production Build

```bash
npm run build
```

### Deploy

The built files in `dist/` can be deployed to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- AWS S3
- DigitalOcean
- Your own server

### Self-Hosted

```bash
# Build the application
npm run build

# Start production server
npm run start
```

</details>

---

## 🛠️ Tech Stack

<table>
<tr>
<td><strong>Frontend</strong></td>
<td>React 18, TypeScript, Tailwind CSS, Vite, Radix UI, Framer Motion</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Express.js, Node.js, SQLite, Drizzle ORM</td>
</tr>
<tr>
<td><strong>Desktop</strong></td>
<td>Electron, electron-builder</td>
</tr>
<tr>
<td><strong>Mobile</strong></td>
<td>Capacitor, Bluetooth LE, Camera, Haptics</td>
</tr>
<tr>
<td><strong>Hardware</strong></td>
<td>ESC/POS, Serial Port, USB, Network Printers</td>
</tr>
<tr>
<td><strong>PWA</strong></td>
<td>Vite PWA Plugin, Service Workers</td>
</tr>
</table>

---

## 📖 Documentation

### Project Structure

```
opensauce-pos/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Database operations
├── shared/                 # Shared types/schemas
├── docs/                   # Documentation
├── electron.js            # Electron main process
├── preload.js             # Electron preload script
├── capacitor.config.ts    # Capacitor configuration
└── electron-builder.json  # Electron builder config
```

### Available Scripts

#### Development
- `npm run dev` - Start development server
- `npm run electron-dev` - Run Electron app in dev mode
- `npm run capacitor-dev` - Run on mobile device/emulator

#### Building
- `npm run build` - Build for production
- `npm run electron-dist` - Build desktop distributables
- `npm run capacitor-build` - Build and sync mobile platforms

#### Database
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio

#### Type Checking
- `npm run check` - Run TypeScript type checking

---

## 🎯 Use Cases

- **Retail Stores** - Product scanning, inventory, customer loyalty
- **Restaurants & Cafes** - Table management, order processing, kitchen display
- **Service Businesses** - Service catalog, appointments, invoicing
- **Mobile Vendors** - Offline operation, mobile devices, Bluetooth printers
- **Pop-up Shops** - Quick setup, portable, no internet required

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Test on all platforms (Desktop, Mobile, Web)

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea? We'd love to hear from you!

- **Bug Reports**: [Open an issue](https://github.com/rt8digital/opensauce-pos/issues/new?template=bug_report.md)
- **Feature Requests**: [Open an issue](https://github.com/rt8digital/opensauce-pos/issues/new?template=feature_request.md)
- **Discussions**: [Join our Discord](https://discord.gg/CJGGDMVjNP)

---

## 📝 Changelog

### Version 1.0.0 (Current)

#### 🎉 Initial Release

**Features**
- ✨ Modern POS interface with product grid and cart management
- 📦 Comprehensive inventory management system
- 👥 Customer management with WhatsApp integration
- 📊 Sales analytics with interactive charts
- 🎁 Discounts and promotions management
- ⚙️ Extensive settings and configuration options
- 🔌 Hardware integration (printers, scanners, cash drawers)
- 📱 Multi-platform support (Desktop, Mobile, Web)
- 🌐 Offline-first architecture with SQLite
- 🌍 Multi-language support
- ⌨️ Keyboard shortcuts and numpad optimization
- 🎨 Receipt customization with live preview
- 🔐 User authentication and role management
- 📲 Bluetooth device pairing

**Technical**
- Built with React 18 and TypeScript
- Express.js backend with SQLite database
- Electron for desktop applications
- Capacitor for mobile applications
- Tailwind CSS for styling
- Drizzle ORM for database operations

**Platforms**
- Windows Desktop (Electron)
- macOS Desktop (Electron)
- Linux Desktop (Electron)
- Android Mobile (Capacitor)
- iOS Mobile (Capacitor)
- Progressive Web App

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=rt8digital/opensauce-pos&type=Date)](https://star-history.com/#rt8digital/opensauce-pos&Date)

---

## 📞 Connect With Us

<div align="center">

[![Website](https://img.shields.io/badge/Website-rt8.co.za-orange?style=for-the-badge&logo=google-chrome&logoColor=white)](https://rt8.co.za/)
[![Digital Platform](https://img.shields.io/badge/Digital-digital.rt8.co.za-blue?style=for-the-badge&logo=google-chrome&logoColor=white)](https://digital.rt8.co.za)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/CJGGDMVjNP)
[![Instagram](https://img.shields.io/badge/Instagram-@rt8__digital-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/rt8_digital)
[![Email](https://img.shields.io/badge/Email-info@rt8.co.za-red?style=for-the-badge&logo=gmail&logoColor=white)](mailto:info@rt8.co.za)

</div>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 RT8 Digital

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 💝 Support

If you find OpenSauce POS helpful, please consider:

- ⭐ **Starring** this repository
- 🐛 **Reporting** bugs and issues
- 💡 **Suggesting** new features
- 🔀 **Contributing** code
- 📢 **Sharing** with others
- ☕ **Sponsoring** the project

---

<div align="center">

**Made with ❤️ by [RT8 Digital](https://rt8.co.za)**

*OpenSauce POS - Because your POS should be as open as your sauce!* 🔥

[⬆ Back to Top](#-opensauce-pos)

</div>
