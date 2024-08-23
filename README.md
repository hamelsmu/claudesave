# ClaudeSave

> A Chrome extension that saves conversations with Claude to gists.

## Demo

https://github.com/user-attachments/assets/c0d64e6d-5649-451b-9e34-f8a24e90887e


## Usage

### Step 1: Obtain a PAT

Obtain a [personal access token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) with the `gist` scope.

### Step 2: Install the extension

Follow [these steps](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) to load an unpacked extension.  Select the root of this repository as the extension directory.

### Step 3: Save your PAT
After installing the extension, you can click the extension icon to save your PAT.

> ![screenshot](images/screenshots/3_claudesave.png)

### Step 4: Save your conversation

When you are ready to save your conversation, click on the share button with the github icon.

> ![screenshot](images/screenshots/1_claudesave.png)

If you have saved your PAT correctly, a new tab will open with a gist containing your conversation.  You can inspect the logs by clicking on the extension icon and scrolling down to logs to check if there are any issues with your PAT.
