# DIF Hackathon 2024 Demo

<!-- TOC -->
* [DIF Hackathon 2024 Demo](#dif-hackathon-2024-demo)
  * [Points of Interest](#points-of-interest)
  * [Prerequisites](#prerequisites)
    * [API Keys](#api-keys)
    * [Development Environment](#development-environment)
    * [Application Dependencies](#application-dependencies)
  * [How to Run](#how-to-run)
<!-- TOC -->

## Points of Interest

- [The demo app source code](src/dif-workshop.ts)
- [DIF workshop recording](https://us02web.zoom.us/rec/play/8dvcyIxCuCQTtM9kBhc3OW_xtss1wKIgxVVI1oMKz0DPHboBxoRaXEFg727wGeEucYgyttXb-E_JXrSs.upTtHtss3RZMzXVK). Demo presentation starts at `00:33:35`
- [Truvity's DIF Hackathon Discord channel](https://discord.com/channels/1157618771645698068/1286835814948671550)
- [Documentation](https://docs.truvity.cloud/sdk)

## Prerequisites

### API Keys

To run the demo application, you'll need two API keys from different Truvity accounts.

Register new accounts at https://signup.truvity.cloud/dif-hackathon-2024.

Learn how to create a new API key [here](https://docs.truvity.cloud/overview/security/create-api-keys).

Once you've obtained two API keys, please fill in their values in `devbox.json`, replacing the existing `<API_KEY_X>` placeholders

```diff
diff --git a/devbox.json b/devbox.json
index 1c06ae6..1ddbad9 100644
--- a/devbox.json
+++ b/devbox.json
@@ -6,7 +6,7 @@
   ],
   "env": {
     "DEVBOX_COREPACK_ENABLED": "true",
-    "TIM_API_KEY": "<API_KEY_1>",
-    "AIRLINE_API_KEY": "<API_KEY_2>"
+    "TIM_API_KEY": "PFgto...",
+    "AIRLINE_API_KEY": "ZBZ3b..."
   }
 }

```

### Development Environment

This repository uses DevBox to set up the local environment. You can find instructions on how to install it [here](https://www.jetify.com/devbox/docs/installing_devbox/#install-devbox).

Once DevBox is installed, run `devbox shell` to start a new shell with the necessary packages and tools.

Alternatively, you can [configure `direnv`](https://direnv.net/#basic-installation), which will automatically set up the environment.

### Application Dependencies

After setting up the [development environment](#development-environment), install application dependencies with the following command:

```shell
yarn install
```

## How to Run

To launch the application, run the following command in your terminal:

```shell
yarn start
```
