> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

Great — **Pop!_OS + Ryzen 5 4600G (Vega iGPU)** is actually a *good* combo for **Vulkan-based upscaling**. Here’s the **most reliable, lowest-friction setup** I recommend, with **exact commands** and **safe settings** for 2K → 8K.

---

## ✅ Best choice on Pop!_OS (AMD iGPU)

### **Real-ESRGAN (NCNN + Vulkan, CLI)**

**Why this is the right tool for you**

* Uses **Vulkan**, not CUDA → works on AMD iGPU
* **Single 4× pass** = clean 2K → 8K
* Faster and *much* more stable than PyTorch-on-CPU
* No Electron/UI overhead (important on iGPU)

---

## 1️⃣ Verify Vulkan is working (important)

```bash
vulkaninfo | head
```

If you see GPU info (RADV / AMD), you’re good.

If not:

```bash
sudo apt update
sudo apt install -y mesa-vulkan-drivers vulkan-tools
```

---

## 2️⃣ Download Real-ESRGAN NCNN Vulkan (Linux)

```bash
mkdir -p ~/tools/realesrgan && cd ~/tools/realesrgan
wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.3.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip
unzip realesrgan-ncnn-vulkan-20220424-ubuntu.zip
chmod +x realesrgan-ncnn-vulkan
```

---

## 3️⃣ Upscale 2K → 8K (safe iGPU settings)

### **Baseline command (recommended)**

```bash
./realesrgan-ncnn-vulkan \
  -i input.png \
  -o output_8k.png \
  -n realesrgan-x4plus \
  -t 256
```

### Key flags explained (important on Vega iGPU):

| Flag                   | Why it matters                           |
| ---------------------- | ---------------------------------------- |
| `-n realesrgan-x4plus` | Best general-purpose photo model         |
| `-t 256`               | Tile size → prevents VRAM/RAM crashes    |
| (no fp16)              | Vega iGPU often more stable without fp16 |

If you hit memory errors:

```bash
-t 128
```

Slower, but **almost impossible to crash**.

---

## ⏱️ Expected performance (realistic)

On Ryzen 4600G:

* **2K → 8K photo:** ~2–6 minutes
* RAM usage: ~2–4 GB peak
* CPU mostly idle (Vulkan does the work)

This is *normal* — 8K is **33 MP**.

---

## 4️⃣ If you want a GUI instead

### Upscayl (works, but I’m opinionated here)

```bash
flatpak install flathub org.upscayl.Upscayl
```

**My honest take on iGPU + Upscayl**

* Works ✔
* But Electron + Vulkan + iGPU = **more crashes**
* You’ll still need:

  * Tile size = **256 or 128**
  * Expect higher RAM pressure

If you care about **stability > convenience**, stick to CLI.

---

## 5️⃣ Image-type tuning (important)

### 📷 Real photos

```
-n realesrgan-x4plus
```

### 🎨 Anime / illustrations / line art

```
-n realesrgan-x4plus-anime
```

### 🧾 Text / diagrams (receipts, screenshots)

Do **two-step**:

1. Waifu2x (denoise, no scale)
2. Real-ESRGAN x4

This avoids “melting” text edges.

---

## 🔧 Optional Pop!_OS optimizations (worth doing)

```bash
# Ensure AMD RADV is used
echo "RADV_PERFTEST=aco" >> ~/.profile
```

Reboot after.

---

## My bottom-line recommendation

**For Pop!_OS + Ryzen 4600G:**

* ✅ **Real-ESRGAN NCNN Vulkan**
* ✅ Tile size **256**
* ❌ Avoid PyTorch / CUDA builds
* ⚠️ Expect minutes per image (that’s normal for 8K)

If you want, tell me:

* **Image type** (photo / anime / scanned docs)
* **Batch size** (single vs many images)

I’ll give you a **fully tuned command** (tile, threads, model choice) optimized for *your exact workload*.
