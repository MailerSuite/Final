# Auto-Sync Scripts for Final Repository

This directory contains scripts to automatically sync your Final repository with GitHub.

## Available Scripts

### 1. `sync-now.sh` - One-time Sync

**Usage:** `./scripts/sync-now.sh`

- Immediately syncs all current changes
- Commits and pushes any uncommitted files
- Perfect for manual syncing when needed

### 2. `auto-sync.sh` - Continuous Monitoring

**Usage:** `./scripts/auto-sync.sh`

- Continuously monitors for file changes
- Automatically syncs every 30 seconds
- Shows real-time status and recent commits
- Press `Ctrl+C` to stop

### 3. `setup-auto-sync.sh` - Install System Service

**Usage:** `./scripts/setup-auto-sync.sh`

- Installs auto-sync as a systemd service
- Runs automatically in the background
- Starts on boot
- Requires sudo privileges

## Quick Start

### Option 1: Manual Sync (Recommended for beginners)

```bash
# Sync all current changes immediately
./scripts/sync-now.sh
```

### Option 2: Continuous Auto-Sync

```bash
# Start continuous monitoring (runs until you stop it)
./scripts/auto-sync.sh
```

### Option 3: System Service (Advanced users)

```bash
# Install as system service (requires sudo)
./scripts/setup-auto-sync.sh

# Check service status
sudo systemctl status auto-sync.service

# View live logs
journalctl -u auto-sync.service -f
```

## How It Works

1. **File Monitoring**: Scans for any modified, added, or deleted files
2. **Automatic Commit**: Creates commits with timestamps and file descriptions
3. **GitHub Push**: Pushes changes to your remote repository
4. **Status Updates**: Shows real-time progress and repository status

## Features

- ✅ **Smart Detection**: Only syncs when there are actual changes
- ✅ **Automatic Commits**: Creates meaningful commit messages with timestamps
- ✅ **Error Handling**: Gracefully handles network issues and conflicts
- ✅ **Real-time Feedback**: Shows sync progress and status
- ✅ **Background Operation**: Can run as a system service

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status auto-sync.service

# View error logs
journalctl -u auto-sync.service -n 50

# Restart service
sudo systemctl restart auto-sync.service
```

### Permission Issues

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Check file ownership
ls -la scripts/
```

### Git Issues

```bash
# Check git status
git status

# Check remote configuration
git remote -v

# Test manual push
git push origin main
```

## Security Notes

- Your GitHub personal access token is stored in git config
- Keep your local machine secure
- Don't share the token publicly
- Consider token rotation if needed

## Customization

You can modify the sync interval by editing `auto-sync.sh`:

- Change `sleep 30` to adjust the monitoring frequency
- Modify commit message format
- Add custom file filters

## Support

If you encounter issues:

1. Check the logs: `journalctl -u auto-sync.service`
2. Test manual sync: `./scripts/sync-now.sh`
3. Verify git configuration: `git remote -v`
