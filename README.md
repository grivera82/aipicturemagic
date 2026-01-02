# ✨ AI Picture Magic

<div align="center">

![AI Picture Magic](https://img.shields.io/badge/AI-Picture%20Magic-8b5cf6?style=for-the-badge&logo=magic&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-06b6d4?style=for-the-badge)
![Made with Coffee](https://img.shields.io/badge/Made%20with-☕%20Coffee-brown?style=for-the-badge)

**Transform your photos with the power of AI**

*Upload an image, describe your vision, and watch the magic happen!*

</div>

---

## 🎨 Features

- 🖼️ **Drag & Drop Upload** - Simply drag an image or click to browse
- 💭 **Creative Prompts** - Quick suggestions or write your own transformation
- ⚡ **Fast Generation** - Powered by fal.ai's nano-banana model
- 🔐 **Secure API** - API keys stored safely in Cloudflare Workers
- 🌙 **Premium UI** - Modern glassmorphism design with smooth animations
- 📱 **Responsive** - Works beautifully on desktop and mobile

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-picture-magic.git
cd ai-picture-magic
```

### 2. Deploy the Cloudflare Worker
```bash
npm install -g wrangler
wrangler login
wrangler secret put FAL_API_KEY  # Enter your fal.ai API key
wrangler deploy
```

### 3. Update the Worker URL
Edit `app.js` line 10 with your worker URL:
```javascript
const WORKER_URL = 'https://ai-picture-magic.YOUR_SUBDOMAIN.workers.dev';
```

### 4. Run locally
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML/CSS/JS** | Frontend UI |
| **Cloudflare Workers** | Secure API proxy |
| **fal.ai** | AI image generation |

---

## 📁 Project Structure

```
ai-picture-magic/
├── index.html      # Main HTML
├── styles.css      # Premium styling
├── app.js          # Frontend logic
├── worker.js       # Cloudflare Worker
├── wrangler.toml   # Worker config
└── README.md
```

---

## 🎯 Usage

1. **Upload** - Drag & drop an image or click to browse
2. **Describe** - Choose a quick prompt or write your own
3. **Generate** - Click the button and wait for AI magic
4. **Download** - Save your transformed creation

---

## ✨ Prompt Ideas

| Prompt | Effect |
|--------|--------|
| 🧙 Wizard | Add magical robes and sparkles |
| 🎨 Pop Art | Bold Andy Warhol style colors |
| 🌌 Galaxy | Cosmic background with stars |
| 🎬 Cinematic | Sci-fi movie with neon lights |
| 🖌️ Watercolor | Soft painted edges |
| 🦸 Superhero | Epic cape and costume |

---

## 📝 License

MIT License - feel free to use this project however you want!

---

<div align="center">

Made with ☕ by **Jose Gabriel Rivera Gagliano**

</div>
