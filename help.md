# Android Setup & Execution Guide for PersonaForge (Agent-App)

This guide provides instructions to run the application on Android:
1. **Testing on a Physical Android Phone via Expo Go** (Fastest & Easiest)
2. **Testing on a Physical Device via USB & ADB**
3. **Installing Android Studio & Desktop Emulator on Linux (Ubuntu / Debian)**

---

## Method 1: Physical Android Phone via Expo Go (Fastest — No SDK Setup Required)

If you have an Android smartphone, you can run the app without installing Android Studio or SDK components on your Linux machine:

1. **Install Expo Go**:
   - Open Google Play Store on your phone and search for **Expo Go**.
   - Install the official Expo Go app.

2. **Connect to Same Wi-Fi**:
   - Ensure your computer and your phone are connected to the **same Wi-Fi network**.

3. **Start the Application**:
   In your terminal inside `source_alpha/`:
   ```bash
   npx expo start
   ```

4. **Scan & Run**:
   - Open the **Expo Go** app on your Android phone.
   - Tap **"Scan QR code"** and point your camera at the QR code displayed in your terminal.
   - The JavaScript bundle will download to your phone and the app will load with hot-reload enabled.

> [!TIP]
> If your phone cannot connect to your PC's local IP due to router firewall/isolation, run:
> ```bash
> npx expo start --tunnel
> ```

---

## Method 2: Testing on Physical Android Device via USB (ADB)

To use your physical phone with `adb` and the `--android` command flag:

1. **Enable Developer Options on your Phone**:
   - Open **Settings** -> **About Phone**.
   - Tap **Build Number** 7 times until you see the message *"You are now a developer!"*.
   - Go back to **Settings** -> **System** -> **Developer Options**.
   - Enable **USB Debugging**.

2. **Connect via USB Cable**:
   - Plug the phone into your Linux PC.
   - On the phone screen, select **"Always allow from this computer"** when prompted.

3. **Verify ADB Connection on Linux**:
   ```bash
   adb devices
   ```
   You should see your device listed (e.g., `<device_serial_number>   device`).

4. **Launch the App**:
   ```bash
   npx expo start --android
   ```

---

## Method 3: Installing Android SDK & Virtual Device (Emulator) on Linux

If you want a full desktop Android emulator on your Linux PC:

### Step 1: Install Required Linux Dependencies
```bash
sudo apt update
sudo apt install -y openjdk-17-jdk libpulse0 libglu1-mesa libc6 libstdc++6
```

### Step 2: Set Android Environment Variables
Add the following to your `~/.bashrc` (or `~/.zshrc`):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

Then reload the configuration:
```bash
source ~/.bashrc
```

### Step 3: Install Android Studio
The easiest way to install and manage Android emulators on Linux:
1. Download Android Studio for Linux: https://developer.android.com/studio
2. Extract and launch:
   ```bash
   tar -xvzf android-studio-*-linux.tar.gz
   cd android-studio/bin
   ./studio.sh
   ```
3. In the setup wizard:
   - Choose **Standard Installation** (this automatically installs the Android SDK, platform tools, and hardware accelerator KVM).
   - Set the install path to `/home/<your-username>/Android/Sdk`.

### Step 4: Create a Virtual Device (AVD)
1. In Android Studio, click **More Actions** -> **Virtual Device Manager** (or Tools -> Device Manager).
2. Click **Create Device**.
3. Select **Phone** -> Choose **Pixel 7** or **Pixel 8** -> Click **Next**.
4. Download a system image: **API 34 (UpsideDownCake)** or **API 35**.
5. Click **Finish**.

### Step 5: Verify KVM Hardware Acceleration (Linux Requirement)
Linux emulators require KVM (Kernel-based Virtual Machine) for performance:
```bash
# Check if your CPU supports KVM
kvm-ok
```
If not installed:
```bash
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils
sudo adduser $USER kvm
```
*(Log out and log back in for group changes to take effect).*

### Step 6: Start Emulator from CLI
Once an AVD is created, you can launch it directly from the terminal without opening Android Studio:
```bash
# List available virtual devices
emulator -list-avds

# Start your emulator
emulator -avd <Name_Of_Your_AVD>
```

---

## Starting Both Servers for the PoC

### 1. Launch the OpenAI Agent Server
In terminal tab 1:
```bash
npm run server
```
*(Runs on port 4000 with guardrails and persona loop).*

### 2. Launch the React Native Frontend
In terminal tab 2:
```bash
npx expo start
```
- Press **`a`** to open on Android (connected phone or emulator).
- Press **`w`** to open in web browser (`http://localhost:8081`).
- Scan QR code with **Expo Go** on Android.
