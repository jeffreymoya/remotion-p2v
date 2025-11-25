# Local Development Setup Guide

This guide will walk you through setting up the Remotion P2V (Prompt-to-Video) project on your local machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [API Key Setup](#api-key-setup)
- [CLI Tools Installation](#cli-tools-installation)
- [Verification](#verification)
- [Creating Your First Video](#creating-your-first-video)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

#### Node.js (v18 or higher)
```bash
# Check your Node.js version
node --version

# Should output v18.0.0 or higher
```

**Installation**:
- **macOS**: `brew install node` or download from [nodejs.org](https://nodejs.org/)
- **Linux**: `sudo apt install nodejs npm` or use [nvm](https://github.com/nvm-sh/nvm)
- **Windows**: Download installer from [nodejs.org](https://nodejs.org/)

#### npm (v9 or higher)
```bash
# Check your npm version
npm --version

# Should output v9.0.0 or higher
```

npm is typically installed with Node.js. To upgrade:
```bash
npm install -g npm@latest
```

### Optional but Recommended

#### FFmpeg (for video rendering)
```bash
# Check if FFmpeg is installed
ffmpeg -version
```

**Installation**:
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

#### Git
```bash
# Check if Git is installed
git --version
```

**Installation**:
- **macOS**: `brew install git` or from [git-scm.com](https://git-scm.com/)
- **Linux**: `sudo apt install git`
- **Windows**: Download from [git-scm.com](https://git-scm.com/)

---

## Installation

### 1. Clone or Download the Repository

```bash
# If using Git
git clone <repository-url>
cd remotion-p2v

# Or if you have a zip file
unzip remotion-p2v.zip
cd remotion-p2v
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm install
```

This will install:
- Remotion framework and plugins
- AI provider SDKs
- TTS libraries
- Stock media APIs
- Development tools

**Expected output**: Installation should complete without errors. If you see warnings about peer dependencies, you can usually ignore them.

### 3. Verify Installation

```bash
# Check that Remotion CLI is available
npx remotion --version
```

**Expected output**: Should display the Remotion version (e.g., `4.0.0`)

---

## API Key Setup

The Remotion P2V project requires API keys for various services. Follow these steps to obtain and configure them.

### 1. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### 2. Obtain API Keys

You'll need to sign up for the following services and obtain API keys. All services have free tiers sufficient for development and testing.

#### Required Services

##### Gemini API (Primary AI Provider)

**Cost**: Free tier with generous limits

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

Add to `.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

##### Google Cloud Text-to-Speech (Primary TTS)

**Cost**: Free tier includes $300 credit for 90 days; $4 per 1 million characters afterward

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Text-to-Speech API
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "API Key"
6. Copy the API key

Add to `.env`:
```bash
GOOGLE_TTS_API_KEY=your_google_tts_api_key_here
```

##### Pexels (Primary Stock Media)

**Cost**: 100% Free

1. Visit [Pexels API](https://www.pexels.com/api/)
2. Click "Get Started"
3. Sign up for a free account
4. Copy your API key from the dashboard

Add to `.env`:
```bash
PEXELS_API_KEY=your_pexels_api_key_here
```

#### Optional but Recommended Services

##### Anthropic Claude (Alternative AI Provider)

**Cost**: Free tier with $5 credit; $3 per million input tokens afterward

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up for an account
3. Go to "API Keys" section
4. Click "Create Key"
5. Copy the API key

Add to `.env`:
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

##### OpenAI (Alternative AI Provider)

**Cost**: Pay-as-you-go; no free tier

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to "API Keys" section
4. Click "Create new secret key"
5. Copy the API key

Add to `.env`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

##### ElevenLabs (Alternative TTS Provider)

**Cost**: Free tier with 10,000 characters/month; $5/month for 30,000 characters

1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account
3. Go to Profile Settings
4. Copy your API key

Add to `.env`:
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

##### Unsplash (Alternative Stock Photos)

**Cost**: 100% Free

1. Visit [Unsplash Developers](https://unsplash.com/developers)
2. Register your application
3. Copy your Access Key

Add to `.env`:
```bash
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
UNSPLASH_APP_ID=your_unsplash_app_id_here
# SECRET_KEY is optional for basic usage
```

##### Pixabay (Alternative Stock Media)

**Cost**: 100% Free

1. Visit [Pixabay API Documentation](https://pixabay.com/api/docs/)
2. Sign up for a free account
3. Copy your API key from the documentation page

Add to `.env`:
```bash
PIXABAY_API_KEY=your_pixabay_api_key_here
```

### 3. Verify Environment File

Your `.env` file should look similar to this (with your actual keys):

```bash
# ===================================
# AI Providers
# ===================================
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-api...
OPENAI_API_KEY=sk-...

# ===================================
# Text-to-Speech (TTS) Providers
# ===================================
GOOGLE_TTS_API_KEY=AIzaSy...
ELEVENLABS_API_KEY=sk_...

# ===================================
# Stock Media Providers (free sources)
# ===================================
PEXELS_API_KEY=563492ad6f9170...
UNSPLASH_ACCESS_KEY=abc123...
UNSPLASH_APP_ID=abc123...
PIXABAY_API_KEY=123456...

# ===================================
# Application Settings
# ===================================
FASTIFY_PORT=3000
MUSIC_LIBRARY_PATH=./assets/music-library
```

**Security Note**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

---

## CLI Tools Installation

The project uses CLI-based AI providers that need to be installed globally.

### 1. Install Gemini CLI (Recommended)

**Repository**: https://github.com/google/generative-ai-cli (or search for the official Gemini CLI)

```bash
# Install globally via npm (if available)
npm install -g @google/generative-ai-cli

# Or follow installation instructions from the repository
```

Verify installation:
```bash
gemini --version
```

**Configuration**:
```bash
# Set your API key
gemini config set api_key $GEMINI_API_KEY
```

### 2. Install Codex CLI (OpenAI)

**Repository**: https://github.com/openai/openai-cli (or similar community project)

```bash
# Install globally via npm (if available)
npm install -g openai-cli

# Or follow installation instructions from the repository
```

Verify installation:
```bash
codex --version
```

**Configuration**:
```bash
# Set your API key
codex config set api_key $OPENAI_API_KEY
```

### 3. Install Claude CLI (Anthropic)

**Repository**: https://github.com/anthropics/claude-cli (or similar community project)

```bash
# Install globally via npm (if available)
npm install -g @anthropic-ai/claude-cli

# Or follow installation instructions from the repository
```

Verify installation:
```bash
claude --version
```

**Configuration**:
```bash
# Set your API key
claude config set api_key $ANTHROPIC_API_KEY
```

### CLI Tool Notes

1. **Not all CLI tools may be publicly available**: If a specific CLI tool is not available, you can disable that provider in `config/ai.config.json` by setting `"enabled": false`.

2. **Alternative installation methods**: Some CLI tools may be available via:
   - Direct download from GitHub releases
   - Language-specific package managers (pip, cargo, etc.)
   - Docker containers

3. **Fallback behavior**: The system will automatically fall back to available providers if the primary provider fails. Configure the fallback order in `config/ai.config.json`.

4. **Testing without all CLI tools**: You can still use the project with just one AI provider installed. The system will use the first available provider from the fallback order.

---

## Verification

After completing the setup, verify everything is working correctly.

### 1. Run Tests

```bash
# Run all tests
npm run test
```

This will execute:
- **Schema validation**: Verifies all configuration files are valid
- **Path resolution**: Checks file paths and directory structure
- **Timeline validation**: Tests timeline generation logic

**Expected output**:
```
✓ Schema validation passed
✓ Path resolution passed
✓ Timeline validation passed

All tests passed!
```

If any tests fail, see the [Troubleshooting](#troubleshooting) section.

### 2. Test Individual Components

#### Test Schema Validation
```bash
npm run test:schema
```

#### Test Path Resolution
```bash
npm run test:paths
```

#### Test Timeline Generation
```bash
npm run test:timeline
```

### 3. Verify API Connectivity

Create a simple test to verify API keys are working:

```bash
# This will test if AI providers are accessible
npm run discover -- --test-mode
```

**Expected output**: Should complete without authentication errors.

---

## Creating Your First Video

Now that everything is set up, let's create your first video!

### Understanding the Pipeline

The Remotion P2V pipeline consists of six stages:

1. **Discover**: Generate topic ideas using Google Trends
2. **Curate**: Review and select topics via web UI
3. **Refine**: Enhance selected topic into detailed concept
4. **Script**: Generate full video script with scene descriptions
5. **Gather**: Download stock media and generate voiceover
6. **Build**: Create timeline and render video

### Quick Start: Full Pipeline

```bash
# Run the full pipeline with one command
npm run gen
```

This will:
1. Prompt you for a topic or idea
2. Generate a video concept
3. Create a script with scene descriptions
4. Download stock media (images/videos)
5. Generate voiceover audio
6. Build timeline for Remotion
7. Optionally render the video

### Step-by-Step: Individual Commands

For more control, run each stage separately:

#### Stage 1: Discover Topics

```bash
npm run discover
```

**What it does**: Fetches trending topics from Google Trends and generates video ideas.

**Output**: Creates `public/projects/[project-id]/discovery.json`

#### Stage 2: Curate Topics

```bash
npm run curate
```

**What it does**: Starts a web UI (default: http://localhost:3000) where you can review and select topics.

**Actions**:
1. Open browser to http://localhost:3000
2. Review generated topics
3. Select your favorites
4. Click "Save Selection"

**Output**: Updates `public/projects/[project-id]/curation.json`

#### Stage 3: Refine Concept

```bash
npm run refine
```

**What it does**: Takes selected topic and expands it into a detailed video concept with target duration, tone, and key points.

**Output**: Creates `public/projects/[project-id]/concept.json`

#### Stage 4: Generate Script

```bash
npm run script
```

**What it does**: Generates a complete video script with:
- Scene-by-scene breakdown
- Narration text for each scene
- Visual descriptions
- Timing estimates

**Output**: Creates `public/projects/[project-id]/script.json`

#### Stage 5: Gather Assets

```bash
npm run gather
```

**What it does**:
- Downloads stock photos/videos based on scene descriptions
- Generates voiceover audio using TTS
- Saves all media to project directory

**Output**:
- `public/projects/[project-id]/media/` (stock assets)
- `public/projects/[project-id]/audio/` (voiceover files)

**Time**: Can take 5-15 minutes depending on script length and media count.

#### Stage 6: Build Timeline

```bash
npm run build:timeline
```

**What it does**: Creates a Remotion-compatible timeline file that combines:
- Visual elements (images/videos with transitions and animations)
- Text overlays synced to narration
- Audio tracks

**Output**: Creates `public/projects/[project-id]/timeline.json`

### Preview Your Video

```bash
# Start Remotion Studio
npm run dev
```

**What it does**: Opens Remotion Studio in your browser (default: http://localhost:3000)

**Actions**:
1. Select your composition
2. Preview your video
3. Adjust timing, transitions, or other settings
4. Export when satisfied

### Render Your Video

```bash
# Render with default settings (draft quality)
npm run render:project
```

**Options**:
```bash
# Render specific project
npm run render:project -- --project=my-project-id

# Render with custom quality
npm run render:project -- --quality=high

# Render specific composition
npm run render:project -- --composition=MyVideo
```

**Output**: Video file saved to `out/` directory

**Quality presets**:
- `draft`: Fast rendering, lower quality (good for testing)
- `medium`: Balanced quality and speed
- `high`: High quality, slower rendering
- `production`: Maximum quality, slowest rendering

### Example: Complete Workflow

```bash
# 1. Generate topic ideas
npm run discover

# 2. Open curation UI and select a topic
npm run curate
# (Select topic in browser at http://localhost:3000)

# 3. Refine the selected topic
npm run refine

# 4. Generate detailed script
npm run script

# 5. Download assets and generate voiceover
npm run gather

# 6. Build timeline
npm run build:timeline

# 7. Preview in Remotion Studio
npm run dev

# 8. Render final video
npm run render:project -- --quality=high
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Environment variable X is not defined"

**Cause**: Missing or incorrectly named environment variable in `.env` file.

**Solution**:
1. Check that your `.env` file exists in the root directory
2. Verify the variable name matches exactly (case-sensitive)
3. Ensure there are no spaces around the `=` sign
4. Restart your terminal/command prompt after editing `.env`

```bash
# Correct
GEMINI_API_KEY=abc123

# Incorrect
GEMINI_API_KEY = abc123  # spaces around =
gemini_api_key=abc123    # wrong case
```

#### Issue: "Command not found: gemini/codex/claude"

**Cause**: CLI tool not installed or not in PATH.

**Solution**:
1. Verify the CLI tool is installed:
   ```bash
   npm list -g | grep gemini-cli
   ```
2. Check your PATH:
   ```bash
   echo $PATH
   ```
3. Reinstall the CLI tool globally:
   ```bash
   npm install -g @google/generative-ai-cli
   ```
4. If still not working, disable that provider in `config/ai.config.json`

#### Issue: "API key invalid" or "401 Unauthorized"

**Cause**: Invalid, expired, or incorrectly formatted API key.

**Solution**:
1. Verify the API key is correct (copy-paste from provider dashboard)
2. Check for extra spaces or line breaks in `.env`
3. Ensure the API key has necessary permissions
4. Some providers require you to enable billing even on free tier
5. Check API key hasn't expired or been revoked

#### Issue: "Rate limit exceeded"

**Cause**: Too many API requests in a short time.

**Solution**:
1. Wait a few minutes before retrying
2. Check rate limits in `config/stock-assets.config.json`
3. Consider using multiple providers for better distribution
4. Enable caching to reduce duplicate requests:
   ```json
   {
     "caching": {
       "enabled": true
     }
   }
   ```

#### Issue: "Module not found" errors

**Cause**: Dependencies not properly installed.

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache if issues persist
npm cache clean --force
npm install
```

#### Issue: Video rendering fails or freezes

**Cause**: Insufficient system resources or misconfigured rendering settings.

**Solution**:
1. Reduce concurrency in `config/video.config.json`:
   ```json
   {
     "rendering": {
       "concurrency": 2
     }
   }
   ```
2. Use draft quality for testing:
   ```bash
   npm run render:project -- --quality=draft
   ```
3. Ensure FFmpeg is properly installed
4. Close other resource-intensive applications
5. Check available disk space

#### Issue: "No assets found" or missing media

**Cause**: Assets not downloaded or incorrect paths.

**Solution**:
1. Verify assets were downloaded:
   ```bash
   ls public/projects/[project-id]/media/
   ```
2. Re-run gather stage:
   ```bash
   npm run gather
   ```
3. Check stock asset configuration in `config/stock-assets.config.json`
4. Verify API keys for stock providers are valid

#### Issue: Text-to-speech fails

**Cause**: TTS API issues or invalid configuration.

**Solution**:
1. Verify Google TTS API is enabled in Cloud Console
2. Check API key has necessary permissions
3. Try fallback provider (ElevenLabs):
   ```json
   {
     "defaultProvider": "elevenlabs"
   }
   ```
4. Check voice configuration in `config/tts.config.json`

#### Issue: "Timeline validation failed"

**Cause**: Timeline has gaps, sync issues, or missing assets.

**Solution**:
1. Run timeline test to see specific errors:
   ```bash
   npm run test:timeline
   ```
2. Adjust validation settings in `config/video.config.json`:
   ```json
   {
     "validation": {
       "maxGapMs": 200
     }
   }
   ```
3. Rebuild timeline:
   ```bash
   npm run build:timeline
   ```

### Getting Help

If you're still experiencing issues:

1. **Check logs**: Look for detailed error messages in terminal output
2. **Enable debug mode**: Set `LOG_LEVEL=debug` in `.env`
3. **Review configuration**: Run `npm run test` to validate all configs
4. **Check documentation**: See [CONFIGURATION.md](./CONFIGURATION.md) for detailed config options
5. **Search issues**: Look for similar issues in the project repository
6. **Create an issue**: If problem persists, create a detailed bug report

---

## Next Steps

### Learn More

- **[Configuration Reference](./CONFIGURATION.md)**: Detailed documentation of all config options
- **[Remotion Documentation](https://www.remotion.dev/docs)**: Learn about Remotion framework
- **[Project Architecture](../README.md)**: Understand the project structure

### Customize Your Setup

1. **Adjust AI provider**: Change temperature, model, or provider in `config/ai.config.json`
2. **Customize voices**: Configure TTS voices in `config/tts.config.json`
3. **Modify video style**: Adjust transitions, animations, and text in `config/video.config.json`
4. **Add local music**: Place music files in `./assets/music-library/` and enable in `config/music.config.json`

### Experiment with Different Content

Try creating videos on different topics:
- Educational content (ELI5, science, history)
- Documentary-style videos
- Product reviews or comparisons
- News summaries
- Story-driven narratives

### Optimize for Production

When ready for production use:
1. Switch to high or production quality rendering
2. Enable all stock providers for better asset variety
3. Use ElevenLabs for higher quality voiceover
4. Set up proper error handling and monitoring
5. Consider remote rendering for faster processing

### Best Practices

1. **Test with draft quality first**: Always preview with draft quality before final render
2. **Keep projects organized**: Use descriptive project IDs
3. **Back up your work**: Regularly back up `public/projects/` directory
4. **Monitor API usage**: Keep track of API quotas to avoid unexpected costs
5. **Iterate on scripts**: Don't be afraid to regenerate scripts for better results
6. **Cache wisely**: Enable caching for faster development
7. **Version control configs**: Track changes to configuration files

---

## Frequently Asked Questions

### Do I need all API keys?

No. At minimum, you need:
- One AI provider (Gemini recommended)
- One TTS provider (Google TTS recommended)
- One stock media provider (Pexels recommended)

Additional providers serve as fallbacks and alternatives.

### Are there any costs involved?

Most services have generous free tiers:
- **Gemini**: Free tier available
- **Google TTS**: Free $300 credit for 90 days
- **Pexels, Unsplash, Pixabay**: Completely free

You may incur costs if you:
- Exceed free tier limits
- Use premium providers (OpenAI, ElevenLabs paid tiers)
- Enable paid Remotion features

### How long does it take to generate a video?

Typical timeline for a 10-15 minute video:
- **Discover/Curate/Refine**: 2-5 minutes
- **Script generation**: 2-5 minutes
- **Gather assets**: 5-15 minutes
- **Build timeline**: 1-2 minutes
- **Render (draft)**: 5-10 minutes
- **Render (high quality)**: 20-40 minutes

Total: 35-77 minutes for a complete video

### Can I use my own media?

Yes! Place your own images, videos, or audio in:
- Images/Videos: `public/projects/[project-id]/media/`
- Audio: `public/projects/[project-id]/audio/`
- Music: `./assets/music-library/`

Update the timeline to reference your custom media.

### Can I edit the generated script?

Yes! After generating a script:
1. Open `public/projects/[project-id]/script.json`
2. Edit the JSON directly
3. Re-run gather and build stages
4. Or manually update the timeline

### What video formats are supported?

Output formats:
- MP4 (default, H.264 codec)
- MOV, WebM (configurable in Remotion)
- Audio: MP3, WAV

### Can I change aspect ratio after generation?

Yes, but you'll need to:
1. Update `config/video.config.json` with new aspect ratio
2. Re-run gather stage (to get correctly sized assets)
3. Rebuild timeline

### How do I update dependencies?

```bash
# Update Remotion
npm run upgrade

# Update all dependencies
npm update

# Check for outdated packages
npm outdated
```

---

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 10 GB free space
- **OS**: Windows 10, macOS 10.15, or Linux (Ubuntu 20.04+)
- **Internet**: Stable connection for API calls

### Recommended Requirements

- **CPU**: 4+ cores, 3.0 GHz
- **RAM**: 8+ GB
- **Storage**: 50+ GB free space (SSD preferred)
- **OS**: Latest version of Windows 11, macOS, or Linux
- **Internet**: High-speed connection (25+ Mbps)

### Hardware Acceleration

For faster rendering, enable hardware acceleration:
- **macOS**: Uses Metal by default
- **Windows**: Enable GPU acceleration in Remotion settings
- **Linux**: Install VAAPI or VDPAU drivers

---

Congratulations! You're now ready to create AI-generated videos with Remotion P2V. Happy creating!
