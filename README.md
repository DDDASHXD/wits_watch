# Wits Watch

A simple bun script to watch and upload files in a directly to a remote server via SFTP, automatically based on file changes.

## Requirements

This project relies on **bun**. Please install it before trying to run the script.
Ypu can install bun by opening a terminal (or cmd / powershell on windows) and running the following command:

### MacOS & Linux

```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows

```
powershell -c "irm bun.sh/install.ps1 | iex"
```

After installation, you need to restart your terminal, and then you can test if it's installed by running

```bash
bun -v
```

## Usage

```bash
bun watch-upload
```

## Installation and setup

Complete installation script (copy and paste whole block into terminal)

```bash
# Clone the directory
git clone https://github.com/DDDASHXD/wits_watch.git
cd wits_watch

# Install dependencies
bun install

# rename .env.example to .env
mv .env.example .env
```

After you've done this, open the `.env` file and fill in the values.
