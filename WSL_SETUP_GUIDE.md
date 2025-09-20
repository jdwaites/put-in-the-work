# 🐧 WSL Ubuntu Development Setup Guide

## 🚀 Quick Setup for Ubuntu WSL

### Step 1: Access Your Project in WSL
```bash
# Open Ubuntu WSL terminal
wsl

# Navigate to your project (WSL can access Windows files)
cd /mnt/c/Users/jamal/OneDrive/Documents/Learning/putting-in-the-work

# Or copy project to WSL filesystem for better performance
cp -r /mnt/c/Users/jamal/OneDrive/Documents/Learning/putting-in-the-work ~/putting-in-the-work
cd ~/putting-in-the-work
```

### Step 2: Install Node.js (Ubuntu WSL)
```bash
# Update package list
sudo apt update

# Install Node.js and npm via NodeSource repository (latest LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install yarn (optional but recommended)
npm install -g yarn
```

### Step 3: Install Project Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Install additional dev dependencies
npm install -D typescript ts-node @types/node nodemon

# Frontend dependencies  
cd ../frontend
npm install

# Install UI libraries
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install recharts firebase

# Install development tools globally
npm install -g firebase-tools
npm install -g typescript
```

### Step 4: Setup Firebase
```bash
# Login to Firebase (will open browser)
firebase login

# Initialize Firebase in project root
cd ..
firebase init

# Select:
# - Functions (for backend)
# - Hosting (for frontend)
# - Firestore (for database)
# - Emulators (for local development)
```

### Step 5: Environment Configuration

#### Create Backend Environment File
```bash
# In backend directory
cd backend
nano .env
```

Add to `.env`:
```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
FIREBASE_PROJECT_ID=your_project_id
NODE_ENV=development
PORT=5000
```

#### Create Frontend Environment File
```bash
# In frontend directory
cd ../frontend
nano .env.local
```

Add to `.env.local`:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Step 6: Start Development Servers

#### Method 1: Using Firebase Emulator (Recommended)
```bash
# In project root
firebase emulators:start

# In new terminal, start frontend
cd frontend
npm start
```

#### Method 2: Separate Backend/Frontend
```bash
# Terminal 1: Backend with nodemon for auto-reload
cd backend
npm run dev

# Terminal 2: Frontend React app
cd frontend
npm start
```

### Step 7: VS Code Integration with WSL

#### Open Project in VS Code from WSL
```bash
# Install VS Code server in WSL (if not already done)
code .

# This will:
# 1. Install VS Code server in WSL
# 2. Open your project in VS Code with WSL integration
# 3. Allow you to edit files directly in WSL filesystem
```

#### Recommended VS Code Extensions for WSL
- **WSL** (Microsoft)
- **Remote - WSL** (Microsoft)
- **Thunder Client** (for API testing)
- **Firebase** (Firebase tools)
- **ES7+ React/Redux/React-Native snippets**

## 🔧 WSL-Specific Commands

### File Operations
```bash
# Copy files from Windows to WSL
cp /mnt/c/path/to/file ~/destination/

# Edit files with nano
nano filename

# Edit files with vim
vim filename

# View file contents
cat filename
less filename
```

### Process Management
```bash
# View running processes
ps aux | grep node

# Kill process by PID
kill <PID>

# Kill all node processes
pkill node

# View port usage
sudo netstat -tulpn | grep :3000
```

### Performance Tips
```bash
# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h

# Monitor real-time logs
tail -f backend/logs/app.log
```

## 🌐 Access URLs

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Firebase Emulator UI**: http://localhost:4000
- **Firestore Emulator**: http://localhost:8080

### Access from Windows
All localhost URLs work from Windows browser since WSL2 has network integration.

## 🐛 Troubleshooting WSL Issues

### Port Access Issues
```bash
# If ports aren't accessible from Windows:
# Check Windows firewall
# Restart WSL: wsl --shutdown, then wsl

# Forward ports manually if needed
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=localhost
```

### File Permission Issues
```bash
# Fix npm permission issues
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Node.js Issues
```bash
# If Node.js installation fails, try:
sudo apt remove nodejs npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 📊 Testing Checklist for WSL

- [ ] Node.js and npm installed
- [ ] Project dependencies installed
- [ ] Firebase CLI installed and logged in
- [ ] Environment files created
- [ ] Frontend starts on localhost:3000
- [ ] Backend/Firebase emulator running
- [ ] VS Code WSL integration working
- [ ] Can access app from Windows browser
- [ ] File changes trigger hot reload
- [ ] Database operations work in emulator

## 🚀 Production Deployment from WSL

### Build for Production
```bash
# Build frontend
cd frontend
npm run build

# Test production build locally
npm install -g serve
serve -s build -l 3000

# Deploy to Firebase
firebase deploy
```

### Docker Build (if using containers)
```bash
# Build Docker images
docker build -t putting-in-the-work-frontend ./frontend
docker build -t putting-in-the-work-backend ./backend

# Run with docker-compose
docker-compose up -d
```

## 💡 WSL Development Best Practices

1. **Keep files in WSL filesystem** (`~/`) for better performance
2. **Use VS Code with WSL extension** for seamless development
3. **Use `code .` command** to open projects from WSL terminal
4. **Monitor resource usage** with `htop`
5. **Use `screen` or `tmux`** for persistent sessions
6. **Backup your `.env` files** regularly
7. **Use Git from WSL** for version control

## 🔄 Quick Start Commands

```bash
# One-liner setup (after Node.js installation)
cd ~/putting-in-the-work && npm install && cd frontend && npm install && cd .. && firebase emulators:start &amp; cd frontend && npm start

# Stop all development servers
pkill node
pkill firebase
```

---

**Ready to develop!** Your WSL Ubuntu environment will provide a much smoother development experience with better performance and native Linux tooling.