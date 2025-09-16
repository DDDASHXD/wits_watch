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

Start by cloning this repository:

```bash
git clone https://github.com/DDDASHXD/wits_watch.git
```

Then, install dependencies:

```bash
bun install
```

Now you need to rename the `.env.example` file to `.env` and fill in the values.

Then, you can run the script:

```bash
bun watch-upload
```
