#!/usr/bin/env node
// The local, unauthenticated editing backend must never listen on the LAN.
"use strict";
require("./loopback-only.js");
console.log("[cms] Local editing proxy: 127.0.0.1 only.");
require("@staticcms/proxy-server");
