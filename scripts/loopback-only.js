// Restrict unauthenticated local preview/editor servers to this computer.
"use strict";
const net = require("net");
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  if (typeof args[0] === "number" && typeof args[1] !== "string") {
    const callback = args.find(a => typeof a === "function");
    return listen.call(this, args[0], "127.0.0.1", callback);
  }
  if (args[0] && typeof args[0] === "object" &&
      Object.hasOwn(args[0], "port") && !args[0].host) {
    args[0] = { ...args[0], host: "127.0.0.1" };
  }
  return listen.apply(this, args);
};
